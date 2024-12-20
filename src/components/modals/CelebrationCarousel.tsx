import * as React from 'react';
import { Box, IconButton, useBreakpointValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface CelebrationCarouselProps {
  children: React.ReactNode[];
}

export const CelebrationCarousel = ({ children }: CelebrationCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const itemsPerPage = useBreakpointValue({
    base: 2,    // モバイル（~480px）
    xs: 1,      // 小さいモバイル（~320px）
    sm: 2,      // タブレット（~768px）
    md: 3,      // タブレット（~992px）
    lg: 4,      // 小さいデスクトップ（~1280px）
    xl: 5,      // デスクトップ（1280px~）
  }) || 1;
  
  const totalPages = Math.ceil(children.length / itemsPerPage);

  const navigate = (direction: number) => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + direction;
      if (nextIndex < 0) return totalPages - 1;
      if (nextIndex >= totalPages) return 0;
      return nextIndex;
    });
  };

  return (
    <Box position="relative" w="full">
      <IconButton
        aria-label="Previous"
        icon={<ChevronLeftIcon />}
        position="absolute"
        left="-4"
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => navigate(-1)}
        colorScheme="blue"
        variant="ghost"
      />
      
      <Box overflow="hidden" mx={8}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${itemsPerPage}, 1fr)`,
              gap: '1rem',
              width: '100%',
            }}
          >
            {children.slice(
              currentIndex * itemsPerPage,
              (currentIndex + 1) * itemsPerPage
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      <IconButton
        aria-label="Next"
        icon={<ChevronRightIcon />}
        position="absolute"
        right="-4"
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => navigate(1)}
        colorScheme="blue"
        variant="ghost"
      />
    </Box>
  );
};