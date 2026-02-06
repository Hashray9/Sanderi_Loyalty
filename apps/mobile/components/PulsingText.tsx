import React, { useEffect, useState } from 'react';
import { Motion } from '@legendapp/motion';
import { TextStyle, StyleProp } from 'react-native';

interface PulsingTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

export function PulsingText({ text, style }: PulsingTextProps) {
  const [dim, setDim] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setDim((v) => !v), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Motion.Text
      style={style}
      animate={{ opacity: dim ? 0.4 : 1 }}
      transition={{ type: 'spring', damping: 10, stiffness: 30 }}
    >
      {text}
    </Motion.Text>
  );
}
