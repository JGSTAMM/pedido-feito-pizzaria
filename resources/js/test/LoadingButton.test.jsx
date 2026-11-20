import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoadingButton from '@/Components/LoadingButton';
import { Skeleton, ProductCardSkeleton, TableCardSkeleton } from '@/Components/Skeleton';

describe('LoadingButton component', () => {
    it('renders text and children correctly in idle state', () => {
        render(<LoadingButton>Finalizar Venda</LoadingButton>);
        expect(screen.getByRole('button', { name: /finalizar venda/i })).toBeInTheDocument();
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('triggers onClick when clicked in idle state', () => {
        const handleClick = vi.fn();
        render(<LoadingButton onClick={handleClick}>Enviar</LoadingButton>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and renders spinner when isLoading is true', () => {
        const handleClick = vi.fn();
        render(
            <LoadingButton isLoading={true} loadingText="Processando..." onClick={handleClick}>
                Enviar
            </LoadingButton>
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Processando...')).toBeInTheDocument();

        // Clicking while loading should not trigger onClick
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('respects disabled prop even when not loading', () => {
        const handleClick = vi.fn();
        render(
            <LoadingButton disabled={true} onClick={handleClick}>
                Bloqueado
            </LoadingButton>
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });
});

describe('Skeleton components', () => {
    it('renders generic Skeleton with pulse style', () => {
        const { container } = render(<Skeleton className="h-6 w-20" />);
        expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders ProductCardSkeleton structure', () => {
        const { container } = render(<ProductCardSkeleton />);
        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(3);
    });

    it('renders TableCardSkeleton structure', () => {
        const { container } = render(<TableCardSkeleton />);
        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(3);
    });
});
