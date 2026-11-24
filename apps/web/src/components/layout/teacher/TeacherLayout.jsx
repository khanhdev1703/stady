import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import TeacherSidebar from "@/components/layout/teacher/TeacherSidebar.jsx";

const TeacherLayout = () => {
    return (
        <div className="app-canvas flex min-h-dvh flex-col">
            <TeacherSidebar />

            <main
                className={[
                    // Mobile
                    "flex-1",

                    // Desktop
                    "lg:ml-64",
                    "lg:pt-0",
                ].join(" ")}
            >
                <Suspense
                    fallback={
                        <div
                            aria-busy="true"
                            aria-label="Đang tải nội dung"
                            className="p-4 sm:p-6"
                        >
                            <div className="h-7 w-44 rounded-lg bg-[var(--surface-2)]" />
                            <div className="mt-2 h-4 w-64 rounded bg-[var(--surface-2)]" />
                            <div className="mt-6 h-40 rounded-2xl bg-[var(--surface-2)]" />
                        </div>
                    }
                >
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
};

export default TeacherLayout;
