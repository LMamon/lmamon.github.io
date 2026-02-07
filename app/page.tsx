import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.about}>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>about</span>
        <span className={styles["aboutSeparator"]}>:</span>
        <span className={styles["aboutValue"]}> test</span>
      </div>
    </div>
  );
}
