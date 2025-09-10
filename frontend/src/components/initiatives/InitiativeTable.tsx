import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  Paper,
  Badge,
  ActionIcon,
  Group,
  Text,
  Anchor,
  ScrollArea,
  Center,
  Stack,
  UnstyledButton,
  rem
} from '@mantine/core';
import { 
  IconEdit, 
  IconEye, 
  IconChevronUp, 
  IconChevronDown, 
  IconSelector,
  IconFileDescription
} from '@tabler/icons-react';
import type { Initiative } from '../../types/initiative';
import { useFilters } from '../../contexts/FiltersContext';

interface InitiativeTableProps {
  initiatives: Initiative[];
}

const InitiativeTable: React.FC<InitiativeTableProps> = ({ initiatives }) => {
  const { sort, updateSort } = useFilters();

  const handleSort = (field: keyof Initiative) => {
    if (sort.field === field) {
      updateSort({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSort({ field, direction: 'asc' });
    }
  };

  const SortIcon: React.FC<{ field: keyof Initiative }> = ({ field }) => {
    if (sort.field !== field) {
      return <IconSelector style={{ width: rem(16), height: rem(16) }} stroke={1.5} color="var(--mantine-color-dimmed)" />;
    }
    
    return sort.direction === 'asc' ? (
      <IconChevronUp style={{ width: rem(16), height: rem(16) }} stroke={1.5} color="var(--mantine-color-blue-6)" />
    ) : (
      <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} color="var(--mantine-color-blue-6)" />
    );
  };

  // Professional status badge color mapping following Mantine design system
  const STATUS_COLORS = {
    'idea': 'gray',
    'proposal': 'blue', 
    'pilot': 'pink',
    'production': 'green',
    'retired': 'dark'
  } as const;

  const getRiskColor = (risks?: string): 'green' | 'yellow' | 'orange' | 'red' | 'gray' => {
    if (!risks) return 'gray';
    
    const riskLevel = risks.toLowerCase();
    if (riskLevel.includes('high') || riskLevel.includes('critical')) {
      return 'red';
    } else if (riskLevel.includes('medium') || riskLevel.includes('moderate')) {
      return 'orange';
    } else if (riskLevel.includes('low')) {
      return 'green';
    }
    return 'gray';
  };

  const getRiskLabel = (risks?: string): string => {
    if (!risks) return 'Unknown';
    
    const riskLevel = risks.toLowerCase();
    if (riskLevel.includes('high')) return 'High';
    if (riskLevel.includes('critical')) return 'Critical';
    if (riskLevel.includes('medium')) return 'Medium';
    if (riskLevel.includes('moderate')) return 'Moderate';
    if (riskLevel.includes('low')) return 'Low';
    
    return risks.split(' ')[0] || 'Unknown';
  };

  if (initiatives.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Stack align="center" gap="md">
            <IconFileDescription size={48} stroke={1.5} color="var(--mantine-color-dimmed)" />
            <div>
              <Text size="lg" fw={500} ta="center">No initiatives found</Text>
              <Text size="sm" c="dimmed" ta="center" mt={4}>
                Try adjusting your search or filters
              </Text>
            </div>
          </Stack>
        </Center>
      </Paper>
    );
  }

  const Th: React.FC<{ 
    children: React.ReactNode; 
    field?: keyof Initiative; 
    sortable?: boolean;
  }> = ({ children, field, sortable = true }) => {
    return (
      <Table.Th>
        {sortable && field ? (
          <UnstyledButton 
            onClick={() => handleSort(field)}
            style={{
              width: '100%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: rem(4)
            }}
          >
            <Text size="xs" fw={500} tt="uppercase" c="dimmed">
              {children}
            </Text>
            <SortIcon field={field} />
          </UnstyledButton>
        ) : (
          <Text size="xs" fw={500} tt="uppercase" c="dimmed">
            {children}
          </Text>
        )}
      </Table.Th>
    );
  };

  const rows = initiatives.map((initiative) => (
    <Table.Tr key={initiative.id}>
      <Table.Td style={{ verticalAlign: 'top', minWidth: rem(200) }}>
        <div>
          <Anchor 
            component={Link} 
            to={`/initiatives/${initiative.id}`}
            fw={500}
            size="sm"
            lineClamp={2}
          >
            {initiative.title}
          </Anchor>
          <Text 
            size="xs" 
            c="dimmed" 
            lineClamp={2}
            mt={2}
            style={{ maxWidth: rem(300) }}
            title={initiative.background}
          >
            {initiative.background || 'No description'}
          </Text>
        </div>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm">{initiative.program_owner}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm" c="dimmed">{initiative.department}</Text>
      </Table.Td>
      
      <Table.Td>
        <Badge 
          color={STATUS_COLORS[initiative.stage as keyof typeof STATUS_COLORS] || 'gray'}
          variant="light"
          size="sm"
          tt="capitalize"
        >
          {initiative.stage}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Badge 
          color={getRiskColor(initiative.risks)}
          variant="light"
          size="sm"
        >
          {getRiskLabel(initiative.risks)}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm" c="dimmed">
          {new Date(initiative.updated_at).toLocaleDateString()}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group gap={8} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="blue"
            size="sm"
            component={Link}
            to={`/initiatives/${initiative.id}/edit`}
            title="Edit initiative"
          >
            <IconEdit style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
          
          <ActionIcon
            variant="subtle"
            color="blue"
            size="sm"
            component={Link}
            to={`/initiatives/${initiative.id}`}
            title="View initiative"
          >
            <IconEye style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder>
      <ScrollArea>
        <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Th field="title">Title</Th>
              <Th field="program_owner">Owner</Th>
              <Th field="department">Department</Th>
              <Th field="stage">Stage</Th>
              <Th sortable={false}>Risk</Th>
              <Th field="updated_at">Updated</Th>
              <Th sortable={false}>Actions</Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
};

export default InitiativeTable;