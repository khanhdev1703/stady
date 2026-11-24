import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Bell,
    BookOpen,
    CheckCheck,
    ChevronRight,
    Clock,
    RefreshCw,
    UserMinus,
    UserPlus,
} from "lucide-react";

import notificationApi from "@/features/notifications/api.js";
import useNotificationStore from "@/stores/notificationStore.js";
import convertToVNTime from "@/lib/format/convertTimeVN.js";
import appToast from "@/lib/toast.js";

const TYPE_META = {
    COURSE_ENROLLED: {
        icon: UserPlus,
        tone: "brand",
    },
    ENROLLMENT_RENEWED: {
        icon: RefreshCw,
        tone: "brand",
    },
    ENROLLMENT_REMOVED: {
        icon: UserMinus,
        tone: "muted",
    },
    LESSON_ADDED: {
        icon: BookOpen,
        tone: "brand",
    },
    ENROLLMENT_EXPIRING: {
        icon: Clock,
        tone: "danger",
    },
};

const requestNotifications = async () => {
    const response = await notificationApi.getList({
        limit: 30,
    });

    return response?.data || {};
};

const StudentNotifications = () => {
    const navigate = useNavigate();

    const unreadCount = useNotificationStore(
        (state) => state.unreadCount
    );
    const setUnreadCount = useNotificationStore(
        (state) => state.setUnreadCount
    );
    const [items, setItems] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [markingAll, setMarkingAll] =
        useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(false);

            const data = await requestNotifications();

            setItems(data.items || []);
            setWarnings(data.warnings || []);
            setNextCursor(data.nextCursor || null);
            setUnreadCount(data.unreadCount || 0);
        } catch (fetchError) {
            console.error(
                "Get student notifications error:",
                fetchError
            );

            setError(true);
            appToast.error(
                fetchError?.response?.data?.message ||
                    "Không thể tải thông báo."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await requestNotifications();

                if (cancelled) {
                    return;
                }

                setItems(data.items || []);
                setWarnings(data.warnings || []);
                setNextCursor(data.nextCursor || null);
                setUnreadCount(data.unreadCount || 0);
            } catch (fetchError) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Get student notifications error:",
                    fetchError
                );

                setError(true);
                appToast.error(
                    fetchError?.response?.data
                        ?.message ||
                        "Không thể tải thông báo."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [setUnreadCount]);

    useEffect(() => {
        return useNotificationStore.subscribe(
            (state, previousState) => {
                if (
                    state.incomingNonce ===
                    previousState.incomingNonce
                ) {
                    return;
                }

                const notification =
                    state.incomingEvent?.notification;

                if (!notification) {
                    return;
                }

                setItems((prev) =>
                    prev.some(
                        (item) =>
                            item.id === notification.id
                    )
                        ? prev
                        : [notification, ...prev]
                );
            }
        );
    }, []);

    const handleOpen = async (notification) => {
        if (notification.type === "ENROLLMENT_EXPIRING") {
            const courseId =
                notification.data?.courseId;

            if (courseId) {
                navigate(
                    `/student/courses/${courseId}`
                );
            }

            return;
        }

        if (!notification.isRead) {
            try {
                await notificationApi.markRead(
                    notification.id
                );

                setItems((prev) =>
                    prev.map((item) =>
                        item.id === notification.id
                            ? {
                                ...item,
                                isRead: true,
                            }
                            : item
                    )
                );

                useNotificationStore
                    .getState()
                    .markReadLocally(1);
            } catch (markError) {
                console.error(
                    "Mark notification read error:",
                    markError
                );
            }
        }

        if (notification.type === "ENROLLMENT_REMOVED") {
            navigate("/student/courses");
            return;
        }

        const courseId = notification.data?.courseId;

        if (courseId) {
            navigate(`/student/courses/${courseId}`);
        }
    };

    const handleMarkAllRead = async () => {
        if (markingAll) {
            return;
        }

        try {
            setMarkingAll(true);

            await notificationApi.markAllRead();

            setItems((prev) =>
                prev.map((item) => ({
                    ...item,
                    isRead: true,
                }))
            );
            setUnreadCount(0);

            appToast.success(
                "Đã đánh dấu tất cả là đã đọc."
            );
        } catch (markError) {
            console.error(
                "Mark all notifications read error:",
                markError
            );

            appToast.error(
                markError?.response?.data?.message ||
                    "Không thể đánh dấu đã đọc."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    const handleLoadMore = async () => {
        if (!nextCursor || loadingMore) {
            return;
        }

        try {
            setLoadingMore(true);

            const response =
                await notificationApi.getList({
                    cursor: nextCursor,
                    limit: 30,
                });

            const data = response?.data || {};

            setItems((prev) => [
                ...prev,
                ...(data.items || []),
            ]);
            setNextCursor(data.nextCursor || null);
            setUnreadCount(data.unreadCount || 0);
        } catch (loadError) {
            console.error(
                "Load more notifications error:",
                loadError
            );

            appToast.error(
                loadError?.response?.data?.message ||
                    "Không thể tải thêm thông báo."
            );
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="min-h-full bg-[var(--surface-3)]">
            {/* ==================================
                Header
            ================================== */}

            <header className="page-band sticky top-0 z-30 h-16">
                <div className="mx-auto flex h-full w-full max-w-[720px] items-center gap-3 px-4 sm:px-6">
                    <span className="brand-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <Bell size={19} strokeWidth={2} />
                    </span>

                    <h1 className="min-w-0 flex-1 text-[17px] font-semibold tracking-tight text-[var(--ink)]">
                        Thông báo
                    </h1>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[var(--brand-text)] transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCheck size={16} />

                            <span>
                                {markingAll
                                    ? "Đang xử lý..."
                                    : "Đọc tất cả"}
                            </span>
                        </button>
                    )}
                </div>
            </header>

            <div className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState
                        onRetry={fetchNotifications}
                    />
                ) : (
                    <>
                        {warnings.length > 0 && (
                            <section className="mb-5">
                                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--faint)]">
                                    Sắp hết hạn
                                </h2>

                                <div className="space-y-2">
                                    {warnings.map(
                                        (warning) => (
                                            <button
                                                key={warning.id}
                                                type="button"
                                                onClick={() =>
                                                    handleOpen(
                                                        warning
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--danger-soft)] p-4 text-left transition active:opacity-80"
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--danger)]">
                                                    <Clock
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[13px] font-semibold leading-5 text-[var(--ink)]">
                                                        {
                                                            warning.title
                                                        }
                                                    </span>

                                                    <span className="mt-0.5 block text-[12px] leading-5 text-[var(--muted)]">
                                                        {
                                                            warning.body
                                                        }
                                                    </span>
                                                </span>

                                                <ChevronRight
                                                    size={16}
                                                    className="shrink-0 text-[var(--faint)]"
                                                />
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--faint)]">
                                Tất cả thông báo
                            </h2>

                            {items.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-2">
                                    {items.map((item) => {
                                        const meta =
                                            TYPE_META[
                                                item.type
                                            ];
                                        const Icon =
                                            meta?.icon ||
                                            Bell;
                                        const iconTone =
                                            meta?.tone ===
                                            "danger"
                                                ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                                                : meta?.tone ===
                                                    "muted"
                                                  ? "bg-[var(--surface-2)] text-[var(--muted)]"
                                                  : "bg-[var(--brand-soft)] text-[var(--brand-text)]";

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    handleOpen(
                                                        item
                                                    )
                                                }
                                                className="flex w-full items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:opacity-80"
                                            >
                                                <span
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
                                                >
                                                    <Icon
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-start gap-2">
                                                        <span
                                                            className={[
                                                                "flex-1 text-[13px] font-semibold leading-5",
                                                                item.isRead
                                                                    ? "text-[var(--muted)]"
                                                                    : "text-[var(--ink)]",
                                                            ].join(
                                                                " "
                                                            )}
                                                        >
                                                            {
                                                                item.title
                                                            }
                                                        </span>

                                                        {!item.isRead && (
                                                            <span
                                                                aria-label="Chưa đọc"
                                                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-solid)]"
                                                            />
                                                        )}
                                                    </span>

                                                    <span className="mt-0.5 block text-[12px] leading-5 text-[var(--muted)]">
                                                        {
                                                            item.body
                                                        }
                                                    </span>

                                                    <span className="mt-1 block text-[12px] text-[var(--faint)]">
                                                        {convertToVNTime(
                                                            item.createdAt
                                                        )}
                                                    </span>
                                                </span>

                                                <ChevronRight
                                                    size={16}
                                                    className="mt-2 shrink-0 text-[var(--faint)]"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {nextCursor && (
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadingMore
                                        ? "Đang tải..."
                                        : "Xem thêm"}
                                </button>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

const LoadingState = () => {
    return (
        <div
            aria-busy="true"
            aria-label="Đang tải thông báo"
            className="space-y-2"
        >
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[var(--surface-2)]" />

                    <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
                        <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-2)]" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-[var(--surface-2)]" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const ErrorState = ({ onRetry }) => {
    return (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[var(--muted)]">
                Không tải được thông báo
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex h-11 items-center rounded-full bg-[var(--brand-solid)] px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)]"
            >
                Thử lại
            </button>
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--faint)]">
                <Bell size={21} />
            </div>

            <p className="mt-3 text-sm font-medium text-[var(--muted)]">
                Chưa có thông báo nào
            </p>

            <p className="mt-1 text-xs text-[var(--faint)]">
                Hoạt động trong khóa học của bạn
                sẽ xuất hiện ở đây.
            </p>
        </div>
    );
};

export default StudentNotifications;
