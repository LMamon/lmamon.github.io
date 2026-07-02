import styles from "./page.module.css";

export default function Projects() {
  return (
        <ul className={styles.projects}>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/cuMoT.git">cuMoT
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/OWLViT">OWLViT
            </a>
          </li>
          <li className={styles.projectsRow}> 
            <a 
              href="https://github.com/LMamon/arctic-seals-rso">Mulitspectral Seal Detection + Analysis
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/cv-feature-matching">CV Feature matching
            </a>
          </li>
          <li className={styles.projectsRow}>
            <a 
              href="https://github.com/LMamon/RXSIM">RXSIM - autonomous uav + testbed
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