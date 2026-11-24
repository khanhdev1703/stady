import { NavLink } from "react-router-dom";

import studentMenuItems from "@/components/layout/student/studentMenuItems.js";
import useNotificationStore from "@/stores/notificationStore";

const StudentBottomNav = () => {
    const unreadCount = useNotificationStore(
        (state) => state.unreadCount
    );

    return (
        <nav
            aria-label="Điều hướng chính"
            className={[
                "fixed inset-x-0 bottom-0 z-50 lg:hidden",
                "flex h-[calc(4rem_+_env(safe-area-inset-bottom))]",
                "border-t border-[var(--line)]",
                "bg-[var(--surface)]",
                "pb-[env(safe-area-inset-bottom)]",
            ].join(" ")}
        >
            {studentMenuItems.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            [
                                "relative flex flex-1 flex-col items-center justify-center gap-1",
                                "text-[12px] leading-none",
                                "transition-colors duration-200",
                                isActive
                                    ? "font-semibold text-[var(--brand-text)]"
                                    : "font-medium text-[var(--muted)]",
                            ].join(" ")
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    aria-hidden="true"
                                    className={[
                                        "absolute left-1/2 top-0 h-[3px] w-10 -translate-x-1/2",
                                        "rounded-b-full",
                                        isActive
                                            ? "bg-[var(--brand-solid)]"
                                            : "opacity-0",
                                    ].join(" ")}
                                />

                                <span className="relative">
                                    <Icon
                                        size={20}
                                        strokeWidth={
                                            isActive
                                                ? 2.2
                                                : 1.8
                                        }
                                    />

                                    {item.showBadge &&
                                        unreadCount > 0 && (
                                            <span className="absolute -right-2.5 -top-1.5 min-w-5 rounded-full bg-[var(--danger-solid)] px-1 text-center text-[12px] font-semibold leading-5 text-[var(--on-danger)]">
                                                {unreadCount >
                                                99
                                                    ? "99+"
                                                    : unreadCount}
                                            </span>
                                        )}
                                </span>

                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default StudentBottomNav;
