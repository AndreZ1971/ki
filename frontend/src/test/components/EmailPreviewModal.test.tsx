/**
 * EmailPreviewModal Component Tests
 * 
 * Tests für die Email-Vorschau Modal-Component:
 * - Rendering und Visibility
 * - User Interactions (Close, Send, Copy)
 * - Customer count display
 * - Animation states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPreviewModal } from '../../components/EmailPreviewModal';

describe('EmailPreviewModal', () => {
  const mockEmailData = {
    subject: 'Test Subject',
    body: 'Test email body content',
  };

  const mockCustomers = [
    { id: 1, email: 'customer1@test.com' },
    { id: 2, email: 'customer2@test.com' },
    { id: 3, email: 'customer3@test.com' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    emailData: mockEmailData,
    selectedCustomers: mockCustomers,
    onSend: vi.fn(),
    onCopy: vi.fn(),
    isSending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByText(/Email Vorschau/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<EmailPreviewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/Email Vorschau/i)).not.toBeInTheDocument();
    });

    it('should not render when emailData is null', () => {
      render(<EmailPreviewModal {...defaultProps} emailData={null} />);

      expect(screen.queryByText(/Email Vorschau/i)).not.toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display customer count', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByText(/Wird an 3 Kunden gesendet/i)).toBeInTheDocument();
    });

    it('should display correct count for single customer', () => {
      render(
        <EmailPreviewModal
          {...defaultProps}
          selectedCustomers={[mockCustomers[0]]}
        />
      );

      expect(screen.getByText(/Wird an 1 Kunden gesendet/i)).toBeInTheDocument();
    });

    it('should display email subject', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    it('should display email body', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByText('Test email body content')).toBeInTheDocument();
    });

    it('should show email emoji in header', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByText(/📧/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EmailPreviewModal {...defaultProps} onClose={onClose} />);

      // Find close button by its accessible role
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((button) => button.textContent === '✕');

      if (closeButton) {
        await user.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onSend when send button clicked', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<EmailPreviewModal {...defaultProps} onSend={onSend} />);

      const sendButton = screen.getByRole('button', { name: /senden/i });
      await user.click(sendButton);

      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should disable send button when isSending is true', () => {
      render(<EmailPreviewModal {...defaultProps} isSending={true} />);

      const sendButton = screen.getByRole('button', { name: /wird gesendet/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show "Wird gesendet..." when isSending', () => {
      render(<EmailPreviewModal {...defaultProps} isSending={true} />);

      expect(screen.getByText(/Wird gesendet.../i)).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should call onCopy with subject when subject copy button clicked', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();

      render(<EmailPreviewModal {...defaultProps} onCopy={onCopy} />);

      const copyButtons = screen.getAllByRole('button', { name: /📋/i });
      // First copy button should be for subject
      await user.click(copyButtons[0]);

      expect(onCopy).toHaveBeenCalledWith('Test Subject');
    });

    it('should call onCopy with body when body copy button clicked', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();

      render(<EmailPreviewModal {...defaultProps} onCopy={onCopy} />);

      const copyButtons = screen.getAllByRole('button', { name: /📋/i });
      // Second copy button should be for body
      await user.click(copyButtons[1]);

      expect(onCopy).toHaveBeenCalledWith('Test email body content');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedCustomers array', () => {
      render(<EmailPreviewModal {...defaultProps} selectedCustomers={[]} />);

      expect(screen.getByText(/Wird an 0 Kunden gesendet/i)).toBeInTheDocument();
    });

    it('should handle empty email subject', () => {
      const emptySubjectData = { ...mockEmailData, subject: '' };

      render(<EmailPreviewModal {...defaultProps} emailData={emptySubjectData} />);

      // Modal should still render
      expect(screen.getByText(/Email Vorschau/i)).toBeInTheDocument();
    });

    it('should handle empty email body', () => {
      const emptyBodyData = { ...mockEmailData, body: '' };

      render(<EmailPreviewModal {...defaultProps} emailData={emptyBodyData} />);

      // Modal should still render
      expect(screen.getByText(/Email Vorschau/i)).toBeInTheDocument();
    });

    it('should handle long customer list', () => {
      const manyCustomers = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        email: `customer${i}@test.com`,
      }));

      render(
        <EmailPreviewModal {...defaultProps} selectedCustomers={manyCustomers} />
      );

      expect(screen.getByText(/Wird an 100 Kunden gesendet/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have descriptive button text', () => {
      render(<EmailPreviewModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /senden/i })).toBeInTheDocument();
    });
  });
});
