import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);

    await user.click(screen.getByText('Click Me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );

    await user.click(screen.getByText('Disabled Button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('should render full width button', () => {
    render(<Button fullWidth>Full Width</Button>);

    const button = screen.getByText('Full Width');
    expect(button).toBeInTheDocument();
  });

  it('should render button with type submit', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should render button with type button', () => {
    render(<Button type="button">Click</Button>);

    const button = screen.getByText('Click');
    expect(button).toHaveAttribute('type', 'button');
  });
});




