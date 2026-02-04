import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';

const SCREEN = Dimensions.get('window');
const MENU_WIDTH = 220;

export default function AnchorMenu({
  visible,
  onClose,
  anchor,
  items,
}) {
  if (!visible) return null;

  const left = Math.min(
    anchor.x - MENU_WIDTH,
    SCREEN.width - MENU_WIDTH - 8
  );

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      {/* klik izven zapre */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            { top: anchor.y + 6, left },
          ]}
        >
          {items.map((item, index) => (
         <Pressable
            key={index}
            style={[
                styles.item,
                item.disabled && styles.disabledItem,
            ]}
            disabled={item.disabled}
            onPress={() => {
                //if (item.disabled) return;
                onClose();
                item.onPress();
            }}
          >
              <Text
                style={[
                  styles.text,
                  item.destructive && styles.destructive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Prekliči</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6,
    paddingVertical: 4,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
  },
  destructive: {
    color: 'red',
  },
  cancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    padding: 12,
    marginTop: 4,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledItem: {
    opacity: 0.3,
  },
});
