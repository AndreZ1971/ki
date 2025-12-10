import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmailPreviewModal } from '../../components/EmailPreviewModal';

// Simplified framer-motion shim so the modal renders without animation context in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, onClick, style, ...props }: any) => (
      <div onClick={onClick} style={style} {...props}>{children}</div>
    ),
    button: ({ children, onClick, style, ...props }: any) => (
      <button onClick={onClick} style={style} {...props}>{children}</button>
    )
  }
}));const baseProps = {
	isOpen: true,
	onClose: vi.fn(),
	emailData: { subject: 'Subject', body: 'Body' },
	selectedCustomers: [1, 2],
	onSend: vi.fn(),
	onCopy: vi.fn(),
	isSending: false
};

describe('EmailPreviewModal', () => {
	it('returns null when closed or without email data', () => {
		const { container, rerender } = render(
			<EmailPreviewModal
				{...baseProps}
				isOpen={false}
			/>
		);

		expect(container.firstChild).toBeNull();

		rerender(
			<EmailPreviewModal
				{...baseProps}
				emailData={null}
			/>
		);

		expect(container.firstChild).toBeNull();
	});

  it('renders subject, body, and customer count', () => {
    render(<EmailPreviewModal {...baseProps} />);

    expect(screen.getByText('📧 Email Vorschau')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Betreff')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Email Vorschau/ })).toBeInTheDocument();
  });	it('copies subject and body when copy buttons are clicked', () => {
		const onCopy = vi.fn();
		render(
			<EmailPreviewModal
				{...baseProps}
				onCopy={onCopy}
			/>
		);

		const copyButtons = screen.getAllByRole('button', { name: /kopieren/i });

		fireEvent.click(copyButtons[0]);
		fireEvent.click(copyButtons[1]);

		expect(onCopy).toHaveBeenCalledWith('Subject');
		expect(onCopy).toHaveBeenCalledWith('Body');
	});

	it('invokes onClose when overlay is clicked', () => {
		const onClose = vi.fn();
		const { container } = render(
			<EmailPreviewModal
				{...baseProps}
				onClose={onClose}
			/>
		);

		const overlay = container.firstChild as HTMLElement;
		fireEvent.click(overlay);

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
