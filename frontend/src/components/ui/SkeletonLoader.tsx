import React from 'react';
import { Box, Skeleton, useTheme, useMediaQuery } from '@mui/material';

// Skeleton for list items (cards, table rows, etc.)
interface ListSkeletonProps {
  count?: number;
  height?: number;
  showAvatar?: boolean;
  showText?: boolean;
  showActions?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  height = 80,
  showAvatar = true,
  showText = true,
  showActions = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} display="flex" alignItems="center" gap={2} p={2}>
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <Box flex={1}>
            {showText && (
              <>
                <Skeleton variant="text" width={isMobile ? '60%' : '40%'} height={20} />
                <Skeleton variant="text" width={isMobile ? '80%' : '60%'} height={16} sx={{ mt: 1 }} />
              </>
            )}
          </Box>
          {showActions && (
            <Box display="flex" gap={1}>
              <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

// Skeleton for data grids and tables
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  height?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  height = 400,
  showHeader = true
}) => {
  return (
    <Box>
      {showHeader && (
        <Box display="flex" gap={2} p={2} borderBottom="1px solid #E2E8F0">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} variant="text" width={120} height={20} />
          ))}
        </Box>
      )}
      <Box sx={{ height: height - 50, overflow: 'hidden' }}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box
            key={`row-${rowIndex}`}
            display="flex"
            gap={2}
            p={2}
            borderBottom="1px solid #F1F5F9"
            alignItems="center"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={colIndex === 0 ? 150 : 100}
                height={20}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Skeleton for card grids
interface CardGridSkeletonProps {
  cards?: number;
  height?: number;
  columns?: number;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  cards = 6,
  height = 200,
  columns = { xs: 1, sm: 2, md: 3 }
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const getColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return typeof columns === 'object' ? columns.md || 3 : columns;
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${getColumns()}, 1fr)`}
      gap={2}
    >
      {Array.from({ length: cards }).map((_, index) => (
        <Box key={index}>
          <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// Skeleton for dashboard stats/metrics
interface StatsSkeletonProps {
  count?: number;
  height?: number;
}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({
  count = 4,
  height = 100
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(2, 1fr)',
        md: `repeat(${count}, 1fr)`
      }}
      gap={2}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} p={2}>
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="60%" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" height={14} sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  );
};

// Skeleton for page headers
interface PageHeaderSkeletonProps {
  showSubtitle?: boolean;
  showActions?: boolean;
}

export const PageHeaderSkeleton: React.FC<PageHeaderSkeletonProps> = ({
  showSubtitle = true,
  showActions = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box display="flex" justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} mb={3}>
      <Box>
        <Skeleton variant="text" width={300} height={isMobile ? 36 : 48} />
        {showSubtitle && (
          <Skeleton variant="text" width={420} height={20} sx={{ mt: 1 }} />
        )}
      </Box>
      {showActions && (
        <Box display="flex" gap={1}>
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      )}
    </Box>
  );
};

// Full page skeleton loader
interface FullPageSkeletonProps {
  showHeader?: boolean;
  showStats?: boolean;
  showContent?: boolean;
  contentType?: 'cards' | 'table' | 'list';
}

export const FullPageSkeleton: React.FC<FullPageSkeletonProps> = ({
  showHeader = true,
  showStats = true,
  showContent = true,
  contentType = 'cards'
}) => {
  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      {showHeader && <PageHeaderSkeleton />}
      {showStats && <Box mb={3}><StatsSkeleton /></Box>}
      {showContent && (
        <Box>
          {contentType === 'cards' && <CardGridSkeleton />}
          {contentType === 'table' && <TableSkeleton />}
          {contentType === 'list' && <ListSkeleton />}
        </Box>
      )}
    </Box>
  );
};
