import { Fragment, type ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { revealStyle } from './reveal';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';
import { webTextStyle } from './webStyle';

type RevealWordsProps = Omit<TextProps, 'children' | 'style'> & {
  /** Each entry animates as one unit (a word, or a styled phrase such as <GradientText>). */
  words: ReactNode[];
  style?: StyleProp<TextStyle>;
  delay?: number;
  /** ms between consecutive words. */
  stagger?: number;
};

const inlineBlock = webTextStyle({ display: 'inline-block' });

/** Text fade-in-blur: reveals a line word by word with a short stagger. */
export function RevealWords({ words, style, delay = 0, stagger = 70, ...textProps }: RevealWordsProps) {
  const [ref, inView] = useInView<Text>();
  const reduced = useReducedMotion();
  return (
    <Text ref={ref} style={style} {...textProps}>
      {words.map((word, index) => (
        <Fragment key={index}>
          <Text
            style={[
              inlineBlock,
              revealStyle(inView, reduced, { delay: delay + index * stagger, duration: 900, distance: 12, blur: 10 }) as TextStyle,
            ]}
          >
            {word}
          </Text>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Text>
  );
}
