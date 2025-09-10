import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stack, Title, Text, Button, Group, Select, Alert, Center, Loader, ActionIcon
} from '@mantine/core';
import { IconPlus, IconAlertCircle, IconMessageCircle } from '@tabler/icons-react';
import { useInitiatives } from '../../contexts/InitiativesContext';
import { useFilters } from '../../contexts/FiltersContext';
import type { Initiative } from '../../types/initiative';
import InitiativeTable from './InitiativeTable';
import Pagination from './Pagination';
import AIChatPanel from '../chat/AIChatPanel';

const InitiativeList: React.FC = () => {
  const { initiatives, isLoading, error, fetchInitiatives } = useInitiatives();
  const { filters, pagination, sort, updatePagination } = useFilters();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // Filter and sort initiatives
  const filteredAndSortedInitiatives = useMemo(() => {
    let filtered = initiatives.filter((initiative: Initiative) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          initiative.title.toLowerCase().includes(searchLower) ||
          initiative.program_owner.toLowerCase().includes(searchLower) ||
          initiative.department.toLowerCase().includes(searchLower) ||
          initiative.background?.toLowerCase().includes(searchLower) ||
          initiative.goal?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(initiative => initiative.stage === filters.stage);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(initiative => initiative.department === filters.department);
    }

    // Risk filter (extract from risks field)
    if (filters.risk) {
      filtered = filtered.filter(initiative => 
        initiative.risks?.toLowerCase().includes(filters.risk!)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [initiatives, filters, sort]);

  // Paginate results
  const paginatedInitiatives = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredAndSortedInitiatives.slice(startIndex, endIndex);
  }, [filteredAndSortedInitiatives, pagination.page, pagination.pageSize]);

  // Update pagination total when filtered results change
  useEffect(() => {
    updatePagination({ total: filteredAndSortedInitiatives.length });
  }, [filteredAndSortedInitiatives.length, updatePagination]);

  if (error) {
    return (
      <Alert 
        icon={<IconAlertCircle size="1rem" />} 
        title="Error loading initiatives" 
        color="red"
      >
        {error}
      </Alert>
    );
  }

  return (
    <div style={{ marginRight: isChatOpen ? '30%' : 0, transition: 'margin-right 0.3s ease' }}>
      <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} size="h2">AI Initiatives</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Manage and track AI initiatives across your organization
          </Text>
        </div>
      </Group>

      {/* Results Summary */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Showing {paginatedInitiatives.length} of {filteredAndSortedInitiatives.length} initiatives
        </Text>
        <Group gap="xs">
          <ActionIcon
            variant={isChatOpen ? "filled" : "subtle"}
            color="blue"
            size="lg"
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="AI Chat Assistant"
          >
            <IconMessageCircle size={18} />
          </ActionIcon>
          <Text size="sm" c="dimmed">Show:</Text>
          <Select
            value={pagination.pageSize.toString()}
            onChange={(value) => updatePagination({ pageSize: parseInt(value!), page: 1 })}
            data={[
              { value: '10', label: '10' },
              { value: '25', label: '25' },
              { value: '50', label: '50' },
            ]}
            size="xs"
            w={80}
          />
        </Group>
      </Group>

      {/* Table */}
      {isLoading ? (
        <Center h={256}>
          <div>
            <Loader size="lg" />
            <Text mt="md" c="dimmed" ta="center">Loading...</Text>
          </div>
        </Center>
      ) : (
        <InitiativeTable initiatives={paginatedInitiatives} />
      )}

      {/* Pagination */}
      {filteredAndSortedInitiatives.length > pagination.pageSize && (
        <Pagination />
      )}
      
      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initiativeIds={paginatedInitiatives.map(init => init.id)}
      />
      </Stack>
    </div>
  );
};

export default InitiativeList;