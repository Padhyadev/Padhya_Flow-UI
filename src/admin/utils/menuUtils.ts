import { MenuItem } from '../types/permissions';
import { MenuAccessItem } from '../services/types/apiTypes';

/**
 * Builds a hierarchical menu structure from a flat list of menu items
 * 
 * @param flatMenus - Flat list of menu items from the API
 * @returns Array of MenuItem with submenu hierarchy
 */
export function buildMenuHierarchy(flatMenus: MenuAccessItem[]): MenuItem[] {
    if (!flatMenus || flatMenus.length === 0) return [];

    // Filter only active and non-deleted menus
    const activeMenus = flatMenus.filter(m => m.isActive && !m.isDeleted);

    // Sort by display order
    const sortedMenus = [...activeMenus].sort((a, b) => a.displayOrder - b.displayOrder);

    const menuMap = new Map<number, MenuItem>();
    const rootItems: MenuItem[] = [];

    // First pass: Create all menu objects
    sortedMenus.forEach(menu => {
        menuMap.set(menu.id, {
            path: menu.url,
            // Prefix icons with 'fa-' if not already present
            icon: menu.icon ? (menu.icon.startsWith('fa-') ? menu.icon.replace('fa-', '') : menu.icon) : 'circle',
            label: menu.name,
            controller: menu.controller,
            submenu: []
        });
    });

    // Second pass: Build the hierarchy
    sortedMenus.forEach(menu => {
        const menuItem = menuMap.get(menu.id);
        if (menuItem) {
            if (menu.parentId === 0 || !menu.parentId) {
                rootItems.push(menuItem);
            } else {
                const parent = menuMap.get(menu.parentId);
                if (parent) {
                    parent.submenu = parent.submenu || [];
                    parent.submenu.push(menuItem);
                } else {
                    // Fallback for missing parents (shouldn't happen with clean data)
                    rootItems.push(menuItem);
                }
            }
        }
    });

    // Clean up empty submenus
    const cleanMenu = (items: MenuItem[]): MenuItem[] => {
        return items.map(item => {
            if (item.submenu && item.submenu.length === 0) {
                const { submenu, ...rest } = item;
                return rest;
            }
            if (item.submenu) {
                item.submenu = cleanMenu(item.submenu);
            }
            return item;
        });
    };

    return cleanMenu(rootItems);
}
