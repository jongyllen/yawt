import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Copy, FileJson, X } from 'lucide-react-native';

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    onCopyJSON: () => void;
    onSaveToFile: () => void;
    programName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    visible,
    onClose,
    onCopyJSON,
    onSaveToFile,
    programName,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={Typography.h2}>Share Program</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X color={Colors.textSecondary} size={24} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[Typography.bodySecondary, { marginBottom: Spacing.lg }]}>
                                {programName}
                            </Text>

                            <View style={styles.optionsContainer}>
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => {
                                        onCopyJSON();
                                        onClose();
                                    }}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 242, 255, 0.1)' }]}>
                                        <Copy color={Colors.primary} size={24} />
                                    </View>
                                    <Text style={styles.optionText}>Copy JSON</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => {
                                        onSaveToFile();
                                        onClose();
                                    }}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 0, 122, 0.1)' }]}>
                                        <FileJson color={Colors.secondary} size={24} />
                                    </View>
                                    <Text style={styles.optionText}>Save to File</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    option: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    optionText: {
        ...Typography.h3,
        fontSize: 16,
    },
});
