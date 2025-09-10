import React from 'react';
import { Paper, Group, Pagination as MantinePagination, Text } from '@mantine/core';
import { useFilters } from '../../contexts/FiltersContext';

const Pagination: React.FC = () => {
  const { pagination, updatePagination } = useFilters();

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const currentPage = pagination.page;

  const handlePageChange = (newPage: number) => {
    updatePagination({ page: newPage });
  };

  const startItem = (currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(currentPage * pagination.pageSize, pagination.total);

  if (totalPages <= 1) return null;

  return (
    <Paper p="md" withBorder shadow="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Showing{' '}
          <Text component="span" fw={500}>
            {startItem}
          </Text>
          {' '}to{' '}
          <Text component="span" fw={500}>
            {endItem}
          </Text>
          {' '}of{' '}
          <Text component="span" fw={500}>
            {pagination.total}
          </Text>
          {' '}results
        </Text>
        
        <MantinePagination
          total={totalPages}
          value={currentPage}
          onChange={handlePageChange}
          size="sm"
          siblings={1}
          boundaries={1}
          withEdges
        />
      </Group>
    </Paper>
  );
};

export default Pagination;