import ReactMarkdown from "react-markdown";
import styles from "./posts.module.css";

import template from "./markdown/template.md?raw";

type Post = {
  slug: string;
  title: string;
  content: string;
};

type PostsProps = {
  path: string;
  onNavigate: (href: string) => void;
};

const POSTS: Post[] = [{slug: "template", title: "under construction", content: template}];

export default function Posts({path, onNavigate}: PostsProps) {
  const slug = path.startsWith("/posts/")
    ? path.slice("/posts/".length)
    : null;

  const selectedPost = POSTS.find((post) => post.slug === slug);

  if (selectedPost) {
    return (
      <article className={styles.post}>
        <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
      </article>
    );
  }

  return (
    <ul className={styles.posts}>
      {POSTS.map((post, index) => (
        <li
          key={post.slug}
          className={styles.postsRow}
          style={{animationDelay: `${index * 0.05}s`}}
        >
          <a
            href={`/posts/${post.slug}`}
            className={styles.postLink}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(`/posts/${post.slug}`);
            }}
          >
            {post.title}
          </a>
        </li>
      ))}
    </ul>
  );
}