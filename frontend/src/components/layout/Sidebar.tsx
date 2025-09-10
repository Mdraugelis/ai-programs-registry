import React from 'react';
import { 
  Stack,
  TextInput,
  Select,
  Button,
  Text,
  Group,
  Divider,
  Box,
  rem,
  ScrollArea
} from '@mantine/core';
import { IconSearch, IconFilterOff } from '@tabler/icons-react';
import { useFilters } from '../../contexts/FiltersContext';
import { departments, stages, riskLevels } from '../../services/mockData';

const Sidebar: React.FC = () => {
  const { filters, updateFilters, clearFilters } = useFilters();

  const handleFilterChange = (key: string, value: string | null) => {
    updateFilters({ [key]: value === '' || value === null ? undefined : value });
  };

  return (
    <ScrollArea h="100vh" p="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>
            Filters
          </Text>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconFilterOff style={{ width: rem(14), height: rem(14) }} />}
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </Group>

        {/* Search */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Search
          </Text>
          <TextInput
            placeholder="Search initiatives..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
          />
        </Box>

        {/* Stage Filter */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Stage
          </Text>
          <Select
            placeholder="All Stages"
            value={filters.stage || null}
            onChange={(value) => handleFilterChange('stage', value)}
            data={[
              { value: '', label: 'All Stages' },
              ...stages.map((stage) => ({
                value: stage.value,
                label: stage.label,
              })),
            ]}
            clearable
          />
        </Box>

        {/* Department Filter */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Department
          </Text>
          <Select
            placeholder="All Departments"
            value={filters.department || null}
            onChange={(value) => handleFilterChange('department', value)}
            data={[
              { value: '', label: 'All Departments' },
              ...departments.map((dept) => ({
                value: dept,
                label: dept,
              })),
            ]}
            clearable
          />
        </Box>

        {/* Risk Filter */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Risk Level
          </Text>
          <Select
            placeholder="All Risk Levels"
            value={filters.risk || null}
            onChange={(value) => handleFilterChange('risk', value)}
            data={[
              { value: '', label: 'All Risk Levels' },
              ...riskLevels.map((risk) => ({
                value: risk.value,
                label: risk.label,
              })),
            ]}
            clearable
          />
        </Box>

        {/* Active Filters Summary */}
        <Box>
          <Divider my="md" />
          <Text size="sm" fw={500} mb="xs">
            Active Filters:
          </Text>
          <Stack gap="xs">
            {filters.search && (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">Search:</Text>
                <Text size="xs" fw={500} truncate>
                  "{filters.search}"
                </Text>
              </Group>
            )}
            {filters.stage && (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">Stage:</Text>
                <Text size="xs" fw={500} tt="capitalize" truncate>
                  {filters.stage}
                </Text>
              </Group>
            )}
            {filters.department && (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">Department:</Text>
                <Text size="xs" fw={500} truncate>
                  {filters.department}
                </Text>
              </Group>
            )}
            {filters.risk && (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">Risk:</Text>
                <Text size="xs" fw={500} tt="capitalize" truncate>
                  {filters.risk}
                </Text>
              </Group>
            )}
            {!filters.search && !filters.stage && !filters.department && !filters.risk && (
              <Text size="xs" c="dimmed" fs="italic">
                No active filters
              </Text>
            )}
          </Stack>
        </Box>
      </Stack>
    </ScrollArea>
  );
};

export default Sidebar;