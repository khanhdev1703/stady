import { useEffect, useState } from "react";

import {
    ArrowLeft,
    Award,
    Printer,
    ShieldCheck,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import Brand from "@/components/ui/Brand.jsx";
import Loading from "@/components/ui/Loading.jsx";

import learningApi from "@/features/learning/api.js";

import formatDate from "@/lib/format/formatDate.js";

const getErrorMessage = (error, fallback) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status && status < 500 && message) {
        return message;
    }

    return fallback;
};

const CertificatePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const backToCourse = () =>
        navigate(`/student/courses/${courseId}`);

    useEffect(() => {
        if (!courseId) return undefined;

        let active = true;

        const loadCertificate = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await learningApi.issueCertificate(
                        courseId
                    );

                if (!active) return;

                const data = response?.data?.certificate;

                if (!data) {
                    throw new Error(
                        "Không tìm thấy chứng nhận."
                    );
                }

                setCertificate(data);
            } catch (loadError) {
                if (!active) return;

                console.error(
                    "Issue certificate error:",
                    loadError
                );

                setCertificate(null);
                setError(
                    getErrorMessage(
                        loadError,
                        "Không thể tải chứng nhận. Kiểm tra kết nối mạng rồi thử lại."
                    )
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadCertificate();

        return () => {
            active = false;
        };
    }, [courseId]);

    // Chỉ in tờ chứng nhận, không in thanh điều hướng và nút.
    useEffect(() => {
        const beforePrint = () =>
            document.body.classList.add(
                "printing-certificate"
            );

        const afterPrint = () =>
            document.body.classList.remove(
                "printing-certificate"
            );

        window.addEventListener("beforeprint", beforePrint);
        window.addEventListener("afterprint", afterPrint);

        return () => {
            window.removeEventListener(
                "beforeprint",
                beforePrint
            );
            window.removeEventListener(
                "afterprint",
                afterPrint
            );
            document.body.classList.remove(
                "printing-certificate"
            );
        };
    }, []);

    return (
        <div className="min-h-full bg-[var(--surface-3)]">
            <header className="page-band sticky top-0 z-30 h-16 print:hidden">
                <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={backToCourse}
                        aria-label="Quay lại khóa học"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-[var(--ink)] sm:text-lg">
                        Chứng nhận hoàn thành
                    </h1>

                    {certificate && (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--brand-solid)] px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)] sm:inline-flex"
                        >
                            <Printer size={16} />
                            In / Lưu PDF
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <Loading text="Đang chuẩn bị chứng nhận..." />
            ) : error ? (
                <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
                    <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)]">
                            <ShieldCheck
                                size={26}
                                strokeWidth={1.7}
                            />
                        </div>

                        <h2 className="mt-4 text-base font-semibold text-[var(--ink)]">
                            Chưa thể nhận chứng nhận
                        </h2>

                        <p className="mt-1.5 text-[13px] leading-6 text-[var(--muted)]">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={backToCourse}
                            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-solid)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)]"
                        >
                            Về khóa học
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
                    <div className="certificate-frame relative mx-auto aspect-video w-full max-w-[1000px] [container-type:inline-size]">
                        <article className="certificate-sheet absolute inset-0 overflow-hidden rounded-2xl border border-[#dcc9a3] bg-[#fffdf7] text-[#2f2618] shadow-[0_24px_70px_-32px_rgba(15,23,42,0.45)]">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-[1.2cqw] rounded-[0.8cqw] border border-[#e6d5b4]"
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-[2cqw] rounded-[0.6cqw] border border-[#f0e4cc]"
                            />

                            <div className="relative flex h-full flex-col px-[5.6cqw] py-[4.4cqw] max-lg:py-[3.8cqw]">
                                <div className="flex flex-1 flex-col items-center justify-center text-center">
                                    <Brand
                                        width={180}
                                        className="h-auto w-[18cqw]"
                                    />

                                    <p className="mt-[2.2cqw] text-[1.05cqw] font-semibold uppercase tracking-[0.4em] text-[#8a6a2a] max-lg:mt-[2cqw] max-lg:text-[max(8px,1.9cqw)] max-lg:tracking-[0.3em]">
                                        Chứng nhận
                                    </p>

                                    <p className="mt-[1.6cqw] line-clamp-2 max-w-[86%] text-[4.4cqw] font-bold leading-[1.12] tracking-tight text-[#1f1a10] max-lg:mt-[1.6cqw] max-lg:text-[max(19px,5.6cqw)]">
                                        {certificate.studentName}
                                    </p>

                                    <p className="mt-[1.1cqw] text-[1.3cqw] text-[#6f6047] max-lg:mt-[1.2cqw] max-lg:text-[max(8px,2.3cqw)]">
                                        đã hoàn thành khóa học
                                    </p>

                                    <div className="mt-[1.4cqw] h-px w-[9.6cqw] bg-[#d8c39a] max-lg:mt-[1.4cqw] max-lg:w-[14cqw]" />

                                    <p className="mt-[1.3cqw] line-clamp-2 max-w-[84%] text-[2.2cqw] font-semibold leading-snug text-[#2f2618] max-lg:mt-[1.4cqw] max-lg:text-[max(10.5px,3cqw)]">
                                        {certificate.courseTitle}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between gap-[2cqw]">
                                    <div>
                                        <p className="text-[0.95cqw] uppercase tracking-[0.18em] text-[#7c6642] max-lg:text-[max(7.5px,1.7cqw)] max-lg:tracking-[0.12em]">
                                            Ngày hoàn thành
                                        </p>

                                        <p className="mt-[0.35cqw] text-[1.3cqw] font-semibold max-lg:mt-[0.6cqw] max-lg:text-[max(9px,2.3cqw)]">
                                            {formatDate(
                                                certificate.completedAt
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex h-[8cqw] w-[8cqw] items-center justify-center rounded-full border-[0.18cqw] border-[#c89b3c] text-[#a97b1f]">
                                        <div className="flex h-[5.6cqw] w-[5.6cqw] flex-col items-center justify-center rounded-full border-[0.1cqw] border-[#e2c98f]">
                                            <Award
                                                size={20}
                                                strokeWidth={1.8}
                                                className="h-[2.2cqw] w-[2.2cqw]"
                                            />

                                            <span className="mt-[0.2cqw] text-[0.62cqw] font-bold uppercase tracking-wider max-lg:hidden">
                                                Achan
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[0.95cqw] uppercase tracking-[0.18em] text-[#7c6642] max-lg:text-[max(7.5px,1.7cqw)] max-lg:tracking-[0.12em]">
                                            Mã chứng nhận
                                        </p>

                                        <p className="mt-[0.35cqw] font-mono text-[1.2cqw] font-semibold tracking-wide max-lg:mt-[0.6cqw] max-lg:text-[max(8.5px,2.2cqw)]">
                                            {certificate.code}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-solid)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)]"
                        >
                            <Printer size={16} />
                            In / Lưu PDF
                        </button>

                        <button
                            type="button"
                            onClick={backToCourse}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface)]"
                        >
                            Về khóa học
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CertificatePage;
