(function() {
  // ---------- CONFIGURATION ----------
  const DEFAULT_ENDPOINT = 'https://api-stage.cognitivemaps.com/api/v1.0/events';
  const STORAGE_ANONYMOUS_ID = '__marsen_anonymous_id';
  const STORAGE_USER_ID = '__marsen_user_id';
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  const MAX_TOTAL_FILE_SIZE_BYTES = 36 * 1024 * 1024;
  const SUPPORTED_FILE_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  let apiKey = null;
  let endpoint = DEFAULT_ENDPOINT;

  // Internal state
  let anonymousId = null;
  let userId = null;          // explicitly set via setUserId()
  let eventNameOverrides = new WeakMap();  // form -> custom event name
  let debugMode = false;
  let retryConfig = { maxRetries: 3, baseDelay: 1000 };
  let hooks = {
    onEventSent: null,
    onError: null,
    onSuccess: null
  };

  // Read configuration from script tag
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  if (currentScript) {
    apiKey = currentScript.getAttribute('data-api-key');
    const customEndpoint = currentScript.getAttribute('data-endpoint');
    if (customEndpoint) endpoint = customEndpoint;
    debugMode = currentScript.getAttribute('data-debug') === 'true';
  }

  if (!apiKey) {
    console.warn('[Marsen SDK] Missing data-api-key – SDK not initialised');
    return;
  }

  // ---------- UTILITIES ----------
  // Generate an event identifier without requiring an external dependency.
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Write diagnostic messages only when SDK debug mode is enabled.
  function log(...args) {
    if (debugMode) console.log('[Marsen SDK]', ...args);
  }

  // Reuse the visitor ID across page loads or create it on first use.
  function loadAnonymousId() {
    let id = localStorage.getItem(STORAGE_ANONYMOUS_ID);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_ANONYMOUS_ID, id);
      log('Generated new anonymous ID', id);
    }
    return id;
  }

  // Restore the authenticated user ID saved by a previous page load.
  function loadPersistedUserId() {
    const stored = localStorage.getItem(STORAGE_USER_ID);
    if (stored) {
      log('Loaded persisted user ID', stored);
      return stored;
    }
    return null;
  }

  // ---------- PUBLIC API ----------
  window.MarsenSDK = {
    // Set or update the authenticated user ID (call on login)
    setUserId: function(id, persist = true) {
      if (!id || typeof id !== 'string') {
        console.warn('[Marsen SDK] setUserId requires a non‑empty string');
        return;
      }
      userId = id;
      if (persist) {
        localStorage.setItem(STORAGE_USER_ID, id);
      }
      log('User ID set', userId);
    },

    // Clear the current user ID (call on logout)
    clearUserId: function() {
      userId = null;
      localStorage.removeItem(STORAGE_USER_ID);
      log('User ID cleared');
    },

    // Get the currently active user ID (explicit > meta > anonymous)
    getUserId: function() {
      if (userId) return userId;
      const metaUserId = document.querySelector('meta[name="marsen-user-id"]')?.content;
      if (metaUserId) return metaUserId;
      return this.getAnonymousId();
    },

    // Get the persistent anonymous ID
    getAnonymousId: function() {
      if (!anonymousId) {
        anonymousId = loadAnonymousId();
      }
      return anonymousId;
    },

    // Programmatically set an event name for a specific form
    setFormEventName: function(formElement, eventName) {
      if (!(formElement instanceof HTMLFormElement)) {
        console.warn('[Marsen SDK] setFormEventName expects a form element');
        return;
      }
      eventNameOverrides.set(formElement, eventName);
    },

    // Send a custom event (not tied to a form)
    trackEvent: function(eventName, customPayload = {}) {
      const eventId = generateUUID();
      const payload = {
        event_id: eventId,
        event_name: eventName,
        timestamp: Math.floor(Date.now() / 1000),
        user_id: this.getUserId(),
        anonymous_id: this.getAnonymousId(),
        payload: {
          ...customPayload,
          page: {
            page_url: window.location.href,
            page_title: document.title,
            timestamp_iso: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer
          }
        }
      };
      this._sendWithRetry(payload);
    },

    // Enable debug logging
    setDebug: function(enabled) {
      debugMode = enabled;
    },

    // Register hooks for monitoring
    on: function(event, callback) {
      if (event === 'eventSent') hooks.onEventSent = callback;
      else if (event === 'error') hooks.onError = callback;
      else if (event === 'success') hooks.onSuccess = callback;
    },

    // Internal method: send with retries
    _sendWithRetry: function(payload, attempt = 0) {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: this._safeStringify(payload)
      })
      .then(async response => {
        if (response.ok) {
          log('Event sent successfully', payload);
          if (hooks.onSuccess) hooks.onSuccess(payload);
          if (hooks.onEventSent) hooks.onEventSent(payload, response);
          return;
        }

        const responseBody = await response.text();
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}${responseBody ? ` - ${responseBody}` : ''}`
        );
        error.status = response.status;
        throw error;
      })
      .catch(err => {
        log('Send failed', err);
        if (hooks.onError) hooks.onError(err, payload);
        const isRetryable = !err.status || err.status === 408 || err.status === 429 || err.status >= 500;

        if (isRetryable && attempt < retryConfig.maxRetries) {
          const delay = retryConfig.baseDelay * Math.pow(2, attempt);
          log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
          setTimeout(() => this._sendWithRetry(payload, attempt + 1), delay);
        } else if (isRetryable) {
          console.error('[Marsen SDK] Event lost after all retries', payload);
        } else {
          console.error('[Marsen SDK] Event rejected and will not be retried', err);
        }
      });
    },

    // Safe JSON stringify (handles DOM nodes and circular refs)
    _safeStringify: function(obj) {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (value instanceof Element) return undefined;
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return undefined;
          seen.add(value);
        }
        return value;
      });
    }
  };

  // ---------- FORM HANDLING (AUTO-CAPTURE) ----------
  // Resolve the most specific configured event name for a submitted form.
  function getEventName(form) {
    // 1. Programmatic override
    if (eventNameOverrides.has(form)) {
      return eventNameOverrides.get(form);
    }
    // 2. data-event-name attribute
    const attr = form.getAttribute('data-event-name');
    if (attr && typeof attr === 'string') return attr;
    // 3. Form ID
    if (form.id && typeof form.id === 'string') return form.id;
    // 4. Default (with warning)
    if (debugMode) console.warn('[Marsen SDK] Generic event name "form_submit" used – consider providing data-event-name');
    return 'form_submit';
  }

  // Collect non-sensitive scalar fields and keep File objects separate for encoding.
  function extractFormDataSafe(form) {
    const raw = {};
    const normalized = {};
    const files = {};
    const sensitivePatterns = /password|passwd|pwd|card|cvv|cvc|cc_number|creditcard/i;

    Array.from(form.elements).forEach(el => {
      if (!el.name || sensitivePatterns.test(el.name)) return;

      let value;

      if (el.type === 'file') {
        if (el.files && el.files.length > 0) {
          files[el.name] = [
            ...(files[el.name] || []),
            ...Array.from(el.files)
          ];
        }
        return;
      }

      switch (el.type) {
        case 'checkbox':
          value = el.checked;
          break;
        case 'radio':
          if (!el.checked) return;
          value = el.value;
          break;
        case 'select-multiple':
          value = Array.from(el.selectedOptions).map(o => o.value);
          break;
        default:
          value = el.value;
      }

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value)
      ) {
        raw[el.name] = value;
      }

      const lowerKey = el.name.toLowerCase();
      if (!normalized.email && lowerKey.includes('email')) normalized.email = value;
      if (!normalized.name && lowerKey.includes('name')) normalized.name = value;
      if (!normalized.phone && lowerKey.includes('phone')) normalized.phone = value;
    });

    return { raw, normalized, files };
  }

  // Resolve a backend-supported MIME type from browser metadata or the filename.
  function getSupportedFileType(file) {
    const mimeType = (file.type || '').toLowerCase();
    if (SUPPORTED_FILE_TYPES.has(mimeType)) return mimeType;

    const extension = file.name.toLowerCase().split('.').pop();
    const extensionTypes = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return extensionTypes[extension] || null;
  }

  // Reject files the backend cannot process before spending time encoding them.
  function validateFile(file) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File "${file.name}" exceeds the 10 MiB limit`);
    }

    const mimeType = getSupportedFileType(file);

    if (!mimeType) {
      throw new Error(`Unsupported file type for "${file.name}"`);
    }

    return mimeType;
  }

  // Read one browser File as a Data URL containing its MIME type and base64 bytes.
  function fileToDataUrl(file, mimeType) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64Content = typeof result === 'string' ? result.split('base64,')[1] : null;

        if (!base64Content) {
          reject(new Error(`Unable to encode "${file.name}" as base64`));
          return;
        }

        resolve(`data:${mimeType};base64,${base64Content}`);
      };
      reader.onerror = () => reject(reader.error || new Error(`Unable to read "${file.name}"`));
      reader.onabort = () => reject(new Error(`Reading "${file.name}" was cancelled`));
      reader.readAsDataURL(file);
    });
  }

  // Encode every selected file while preserving its form field and useful metadata.
  async function encodeFilesAsBase64(files) {
    const fileEntries = Object.entries(files);
    const totalFileSize = fileEntries.reduce(
      (total, [, selectedFiles]) => total + selectedFiles.reduce((sum, file) => sum + file.size, 0),
      0
    );

    if (totalFileSize > MAX_TOTAL_FILE_SIZE_BYTES) {
      throw new Error('Combined files exceed the 36 MiB request limit');
    }

    const encodedEntries = await Promise.all(
      fileEntries.map(async ([fieldName, selectedFiles]) => {
        const encodedFiles = await Promise.all(
          selectedFiles.map(async file => {
            const mimeType = validateFile(file);

            return {
              name: file.name,
              type: mimeType,
              size: file.size,
              last_modified: file.lastModified,
              content: await fileToDataUrl(file, mimeType)
            };
          })
        );

        return [fieldName, encodedFiles];
      })
    );

    return Object.fromEntries(encodedEntries);
  }

  // Build and send one API-compatible JSON event for a submitted form.
  async function sendFormEvent(form, eventId) {
    const { raw, normalized, files } = extractFormDataSafe(form);
    const currentUserId = window.MarsenSDK.getUserId();
    const currentAnonymousId = window.MarsenSDK.getAnonymousId();
    const eventName = getEventName(form);
    const flattenedPayload = {
      ...raw,
      ...normalized
    };

    try {
      const encodedFiles = await encodeFilesAsBase64(files);
      const basePayload = {
        event_id: eventId,
        event_name: eventName,
        timestamp: Math.floor(Date.now() / 1000),
        user_id: currentUserId,
        anonymous_id: currentAnonymousId,
        payload: {
          ...flattenedPayload,
          ...encodedFiles,
          page: {
            page_url: window.location.href,
            page_title: document.title,
            timestamp_iso: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer
          }
        }
      };

      await window.MarsenSDK._sendWithRetry(basePayload);
    } catch (err) {
      const failedEvent = { event_id: eventId, event_name: eventName };
      console.error('[Marsen SDK] File encoding failed', err);
      if (hooks.onError) hooks.onError(err, failedEvent);
    }
  }

  // Duplicate submission prevention
  const pendingForms = new WeakSet();

  // Capture each real form submission once while allowing the page's own handler to run.
  function onSubmitCapture(event) {
    const form = event.target;
    if (!form || form.nodeName !== 'FORM') return;
    if (pendingForms.has(form)) return;

    pendingForms.add(form);
    sendFormEvent(form, generateUUID())
      .finally(() => setTimeout(() => pendingForms.delete(form), 500));
  }

  // Attach global capture listener
  document.addEventListener('submit', onSubmitCapture, true);

  // Initialise anonymous ID
  anonymousId = loadAnonymousId();
  // Load persisted user ID (if any) into memory
  const persistedUserId = loadPersistedUserId();
  if (persistedUserId) {
    userId = persistedUserId;
    log('Restored user ID from storage', userId);
  }

  log('SDK initialised - capturing form submissions');
})();


// USAGE:
// // On user login
// MarsenSDK.setUserId('user-123@example.com');

// // On logout
// MarsenSDK.clearUserId();

// // Override event name for a dynamic form
// const myForm = document.getElementById('signup-form');
// MarsenSDK.setFormEventName(myForm, 'user_signup');
