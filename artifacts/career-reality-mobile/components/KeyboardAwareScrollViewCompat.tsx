import { Platform, ScrollView, ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

export const AUTH_KEYBOARD_BOTTOM_OFFSET = 24;
export const AUTH_KEYBOARD_EXTRA_SPACE = 28;

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  bottomOffset = AUTH_KEYBOARD_BOTTOM_OFFSET,
  extraKeyboardSpace = AUTH_KEYBOARD_EXTRA_SPACE,
  disableScrollOnKeyboardHide = true,
  ...props
}: Props) {
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      disableScrollOnKeyboardHide={disableScrollOnKeyboardHide}
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
