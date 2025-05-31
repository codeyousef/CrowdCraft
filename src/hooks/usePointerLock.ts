import { useEffect, useCallback, useState } from 'react';

export const usePointerLock = (elementRef: React.RefObject<HTMLElement>) => {
  const [isLocked, setIsLocked] = useState(false);

  const requestLock = useCallback(() => {
    if (!elementRef.current) return;
    
    try {
      elementRef.current.requestPointerLock();
    } catch (error) {
      console.error('Failed to request pointer lock:', error);
    }
  }, [elementRef]);

  const exitLock = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(document.pointerLockElement === elementRef.current);
    };

    const handleLockError = (error: Event) => {
      console.error('Pointer lock error:', error);
      setIsLocked(false);
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('pointerlockerror', handleLockError);

    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('pointerlockerror', handleLockError);
    };
  }, [elementRef]);

  return { isLocked, requestLock, exitLock };
};