/**
 * Shared Components Tests
 * 
 * Tests für wiederverwendbare UI-Components:
 * - LoadingButton: Button mit Loading-State
 * - ErrorMessage: Fehleranzeige-Component
 * - BackButton: Navigation zurück
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingButton } from '../../components/shared/LoadingButton';
import { ErrorMessage } from '../../components/shared/ErrorMessage';

describe('Shared Components', () => {
  describe('LoadingButton', () => {
    it('should render button with children text', () => {
      render(
        <LoadingButton onClick={() => {}} loading={false}>
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should show loading text when loading', () => {
      render(
        <LoadingButton onClick={() => {}} loading={true} loadingText="Processing...">
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Processing...');
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <LoadingButton onClick={handleClick} loading={false}>
          Click me
        </LoadingButton>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <LoadingButton onClick={handleClick} loading={true}>
          Click me
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      // Try to click anyway (should not work)
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <LoadingButton onClick={handleClick} loading={false} disabled={true}>
          Click me
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should apply primary variant class by default', () => {
      render(
        <LoadingButton onClick={() => {}} loading={false}>
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveClass('primary');
    });

    it('should apply secondary variant class when specified', () => {
      render(
        <LoadingButton onClick={() => {}} loading={false} variant="secondary">
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveClass('secondary');
    });

    it('should apply custom className', () => {
      render(
        <LoadingButton onClick={() => {}} loading={false} className="custom-class">
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should apply loading class when loading', () => {
      render(
        <LoadingButton onClick={() => {}} loading={true}>
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveClass('loading');
    });

    it('should use default loading text', () => {
      render(
        <LoadingButton onClick={() => {}} loading={true}>
          Click me
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Lädt...');
    });
  });

  describe('ErrorMessage', () => {
    it('should render error message with text', () => {
      render(<ErrorMessage message="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should not render when message is empty', () => {
      const { container } = render(<ErrorMessage message="" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render close button when onClose provided', () => {
      const handleClose = vi.fn();

      render(<ErrorMessage message="Error" onClose={handleClose} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('✕');
    });

    it('should not render close button when onClose not provided', () => {
      render(<ErrorMessage message="Error" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<ErrorMessage message="Error" onClose={handleClose} />);

      await user.click(screen.getByRole('button'));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have error-message class', () => {
      const { container } = render(<ErrorMessage message="Error" />);

      expect(container.firstChild).toHaveClass('error-message');
    });

    it('should display error icon', () => {
      render(<ErrorMessage message="Error" />);

      const icon = screen.getByText('⚠️');
      expect(icon).toHaveClass('error-icon');
    });

    it('should display error text with correct class', () => {
      render(<ErrorMessage message="Test error" />);

      const text = screen.getByText('Test error');
      expect(text).toHaveClass('error-text');
    });
  });
});
