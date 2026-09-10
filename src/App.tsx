import { useEffect, useState } from "react";
import ClientNav from "./components/ClientNav";
import Projects from "./projects/Projects";
import styles from "./page.module.css";
import Posts from "./posts/Posts";

function About() {
  return (
    <div className={styles.about}>
      <div className={styles.aboutRow}>
        <span className={styles.aboutValue}>Hi, i'm Louis!</span>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>location</span>
        <span className={styles.aboutSeparator}> : </span>
        <span className={styles.aboutValue}>[l 180°, b 0°, r 8 kpc]</span>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>languages</span>
        <span className={styles.aboutSeparator}>: </span>
        <span className={styles.aboutValue}>EN, 日本語</span>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>interests</span>
        <span className={styles.aboutSeparator}>: </span>
        <span className={styles.aboutValue}>
          Computer Vision, the Outdoors, Autonomous Systems
        </span>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}> ---</span>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>software</span>
        <span className={styles.aboutSeparator}> : </span>
        <a
          href="https://github.com/LMamon"
          style={{textDecoration: "underline", textUnderlineOffset: "4px"}}
          className={styles.aboutValue}
        >
          github
        </a>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>data science</span>
        <span className={styles.aboutSeparator}> : </span>
        <a
          href="https://www.kaggle.com/louisjm"
          style={{textDecoration: "underline", textUnderlineOffset: "4px"}}
          className={styles.aboutValue}
        >
          kaggle
        </a>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>models</span>
        <span className={styles.aboutSeparator}> : </span>
        <a
          href="https://huggingface.co/roylvzn"
          style={{textDecoration: "underline", textUnderlineOffset: "4px"}}
          className={styles.aboutValue}
        >
          hf
        </a>
      </div>

      <div className={styles.aboutRow}>
        <span className={styles.aboutLabel}>contact</span>
        <span className={styles.aboutSeparator}> : </span>
        <a
          href="https://www.linkedin.com/in/vzn/"
          style={{textDecoration: "underline", textUnderlineOffset: "4px"}}
          className={styles.aboutValue}
        >
          linkedin
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const navigate = (href: string) => {
    if (href === window.location.pathname) return;

    window.history.pushState({}, "", href);
    setPath(href);
  };

  const content = path === "/projects" ? <Projects /> : path.startsWith("/posts") ? <Posts path={path} onNavigate={navigate} /> : <About />;

  return (
    <main>
      <div className="layout">
        <div className="field-gap">
          <div className="field">
            <ClientNav onNavigate={navigate} />
          </div>
        </div>

        <section key={path}>
          {content}
        </section>
      </div>
    </main>
  );
}