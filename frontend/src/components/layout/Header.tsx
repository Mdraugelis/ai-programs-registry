import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Group, 
  ActionIcon, 
  Text, 
  Button, 
  Avatar, 
  Menu,
  rem,
  Box,
  useMatches
} from '@mantine/core';
import { 
  IconMenu2, 
  IconLogout,
  IconPlus,
  IconList
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onSidebarToggle: () => void;
  onMobileToggle?: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, onMobileToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const isDesktop = useMatches({
    base: false,
    sm: true,
  });

  const handleToggle = () => {
    if (isDesktop) {
      onSidebarToggle();
    } else if (onMobileToggle) {
      onMobileToggle();
    }
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <ActionIcon
          onClick={handleToggle}
          variant="subtle"
          size="lg"
          aria-label="Toggle navigation"
        >
          <IconMenu2 style={{ width: rem(20), height: rem(20) }} />
        </ActionIcon>
        
        <Group gap="xs" component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Avatar
            size={32}
            radius="sm"
            color="blue"
            variant="filled"
          >
            AI
          </Avatar>
          <Text size="xl" fw={700} c="dark">
            AI Atlas
          </Text>
        </Group>
      </Group>

      <Group gap="md" visibleFrom="md">
        <Button
          component={Link}
          to="/initiatives"
          variant="subtle"
          color="gray"
          leftSection={<IconList style={{ width: rem(16), height: rem(16) }} />}
        >
          Initiatives
        </Button>
        <Button
          component={Link}
          to="/initiatives/new"
          leftSection={<IconPlus style={{ width: rem(16), height: rem(16) }} />}
        >
          New Initiative
        </Button>
      </Group>

      {user && (
        <Group gap="sm">
          <Box visibleFrom="sm">
            <Text size="sm" fw={500}>
              {user.name}
            </Text>
            <Text size="xs" c="dimmed" tt="capitalize">
              {user.role}
            </Text>
          </Box>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Avatar size={28} color="blue" radius="xl">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                onClick={logout}
                color="red"
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )}
    </Group>
  );
};

export default Header;