import {
    BookOpen,
    UserRound,
} from "lucide-react";

const teacherMenuItems = [
    {
        section: "Giảng dạy",
        items: [
            {
                label: "Khóa học",
                path: "/teacher/courses",
                icon: BookOpen,
                end: false,
                isShowMenu: true,
            },
        ],
    },

    {
        section: "Tài khoản",
        items: [
            {
                label: "Hồ sơ",
                path: "/teacher/profile",
                icon: UserRound,
                end: true,
                isShowMenu: true,
            },
        ],
    },
];

export default teacherMenuItems;
