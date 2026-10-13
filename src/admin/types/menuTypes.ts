
export interface MenuAccessItem {
    id: number;
    menuId: number;
    menuName: string;
    controller: string;
    action: string;
    roleId: number;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: number;
    createdDate: string;
}

export interface MenuAccessResponse {
    userId: string;
    menus: MenuAccessItem[];
}
