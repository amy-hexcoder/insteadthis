import Image from "next/image";
import type { Topic } from "@/lib/topics";
import { topicStyle } from "@/lib/topics";

/** Image with a topic-tinted backdrop, so layouts hold up before images load or when a post has none. */
export function Cover({
  src,
  alt,
  topic,
  sizes,
  priority,
  className = "",
}: {
  src: string | null;
  alt: string;
  topic: Topic;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`cover ${className}`} style={topicStyle(topic)}>
      <span className="cover__shape" aria-hidden="true" />
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="cover__img" /> : null}
    </div>
  );
}
