import styles from "./page.module.css";

export default function Projects() {
  return (
        <ul className={styles.projects}>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/OWLViT">OWLViT
            </a>
          </li>
          <li className={styles.projectsRow}> 
            <a 
              href="https://github.com/LMamon/iPhoneStreaming">iPhone Sensor Streamer App
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/cv-feature-matching">CV Feature matching
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/robo-sandbox">robotics sandbox
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/VoiceRAG">local VoiceRag
            </a>
          </li>
        </ul>
    );
}  