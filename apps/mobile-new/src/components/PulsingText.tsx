import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface PulsingTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
}

export function PulsingText({ text, style }: PulsingTextProps) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.Text style={[style, animatedStyle]}>
            {text}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({});
