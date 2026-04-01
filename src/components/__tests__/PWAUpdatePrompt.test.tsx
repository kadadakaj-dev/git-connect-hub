import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PWAUpdatePrompt from '../PWAUpdatePrompt';
import { mockPWAState } from '../../test/__mocks__/pwa-register-react';

describe('PWAUpdatePrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock state before each test
        mockPWAState.needRefresh = false;
        mockPWAState.offlineReady = false;
    });

    it('should not render anything when no update is available', () => {
        const { container } = render(<PWAUpdatePrompt />);
        expect(container.firstChild).toBeNull();
    });

    it('should render the update prompt when needRefresh is true', () => {
        mockPWAState.needRefresh = true;
        render(<PWAUpdatePrompt />);
        
        expect(screen.getByText('Nová verzia dostupná')).toBeDefined();
        expect(screen.getByText('Aktualizujte pre najlepší zážitok.')).toBeDefined();
        expect(screen.getByText('Neskôr')).toBeDefined();
        expect(screen.getByText('Aktualizovať')).toBeDefined();
    });

    it('should hide the prompt when "Neskôr" is clicked', () => {
        mockPWAState.needRefresh = true;
        render(<PWAUpdatePrompt />);
        
        const dismissButton = screen.getByText('Neskôr');
        fireEvent.click(dismissButton);
        
        // After clicking dismiss, the component should re-render and return null
        // (This happens via the setNeedRefresh(false) call in handleDismiss)
        expect(screen.queryByText('Nová verzia dostupná')).toBeNull();
    });

    it('should call updateServiceWorker when "Aktualizovať" is clicked', () => {
        mockPWAState.needRefresh = true;
        render(<PWAUpdatePrompt />);
        
        const updateButton = screen.getByText('Aktualizovať');
        fireEvent.click(updateButton);
        
        expect(mockPWAState.updateServiceWorker).toHaveBeenCalledWith(true);
    });
});
