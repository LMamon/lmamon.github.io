import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.about}>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutValue"]}>Hi, i'm Louis!</span>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>location</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <span className={styles["aboutValue"]}>[l 180°, b 0°, r 8 kpc]</span>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>languages</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <span className={styles["aboutValue"]}>EN, 日本語</span>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>interests</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <span className={styles["aboutValue"]}>Computer Vision, the Outdoors, Robotics</span>
      </div>
      <div className={styles["aboutRow"]}>        
        <span className={styles["aboutLabel"]}> ---</span>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>profile1</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <a 
          href="https://github.com/LMamon" 
          style={{ 
            textDecoration: "underline", 
            textUnderlineOffset: "4px" 
          }} 
          className={styles["aboutValue"]}>github</a>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>profile2</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <a 
        href="https://www.kaggle.com/louisjm" 
        style={{ 
            textDecoration: "underline", 
            textUnderlineOffset: "4px" 
          }} 
          className={styles["aboutValue"]}>kaggle</a>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>profile3</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <a
        href="https://huggingface.co/roylvzn"
        style={{ 
            textDecoration: "underline", 
            textUnderlineOffset: "4px" 
          }} 
          className={styles["aboutValue"]}>hf</a>
      </div>
      <div className={styles["aboutRow"]}>
        <span className={styles["aboutLabel"]}>profile4</span>
        <span className={styles["aboutSeparator"]}>: </span>
        <a 
        href="https://www.linkedin.com/in/vzn/" 
        style={{ 
            textDecoration: "underline", 
            textUnderlineOffset: "4px" 
          }} 
        className={styles["aboutValue"]}>linkedin</a>
      </div>
    </div>
  );
}
