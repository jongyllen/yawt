import { StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

export const settingsStyles = StyleSheet.create({
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  item: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    color: Colors.text,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  googleButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    marginTop: Spacing.md,
  },
  spinning: {
    // In a real app we'd use animated API here, but for now just the icon
  },
});
