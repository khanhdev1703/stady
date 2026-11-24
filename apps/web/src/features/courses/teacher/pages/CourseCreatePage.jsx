import { BookOpen, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Breadcrumb from "@/components/ui/Breadcrumb.jsx";
import courseApi from "@/features/courses/api.js";
import resizeImageFile from "@/lib/image/resizeImageFile.js";

const CourseCreatePage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [durationMonths, setDurationMonths] = useState(3);
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    /*
     * ==========================================
     * CLEANUP PREVIEW URL
     * ==========================================
     */

    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    /*
     * ==========================================
     * THUMBNAIL
     * ==========================================
     */

    const handleThumbnailChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn một file hình ảnh.");
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            toast.error("Ảnh không được vượt quá 5MB.");
            return;
        }

        const uploadFile = await resizeImageFile(file);

        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }

        const previewUrl = URL.createObjectURL(uploadFile);

        setThumbnail(uploadFile);
        setThumbnailPreview(previewUrl);
    };

    const handleRemoveThumbnail = () => {
        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }

        setThumbnail(null);
        setThumbnailPreview("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /*
     * ==========================================
     * SUBMIT
     * ==========================================
     */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const nextErrors = {};

        if (!title.trim()) {
            nextErrors.title = "Vui lòng nhập tên khóa học.";
        }

        if (price !== "") {
            const parsedPrice = Number(price);

            if (
                !Number.isInteger(parsedPrice) ||
                parsedPrice < 0
            ) {
                nextErrors.price = "Giá khóa học không hợp lệ.";
            }
        }

        if (durationMonths !== "") {
            const parsedDuration = Number(durationMonths);

            if (
                !Number.isInteger(parsedDuration) ||
                parsedDuration <= 0
            ) {
                nextErrors.duration =
                    "Thời hạn khóa học không hợp lệ.";
            }
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            const fieldId = nextErrors.title
                ? "course-title"
                : nextErrors.price
                    ? "course-price"
                    : "course-duration";

            const field = document.getElementById(fieldId);

            field?.scrollIntoView({
                block: "center",
                behavior: "smooth",
            });

            field?.focus({ preventScroll: true });

            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append("title", title.trim());

            formData.append(
                "description",
                description.trim()
            );

            if (price !== "") {
                formData.append("price", Number(price));
            }

            if (durationMonths !== "") {
                formData.append(
                    "durationMonths",
                    Number(durationMonths)
                );
            }

            if (thumbnail) {
                formData.append("thumbnail", thumbnail);
            }

            const response =
                await courseApi.createCourse(formData);

            toast.success(
                response.message ||
                "Tạo khóa học thành công."
            );

            navigate("/teacher/courses");
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Không thể tạo khóa học."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * ==========================================
     * BACK
     * ==========================================
     */

    const handleBack = () => {
        if (loading) return;

        navigate("/teacher/courses");
    };

    /*
     * ==========================================
     * RENDER
     * ==========================================
     */

    return (
        <div className="min-h-full bg-[var(--bg)] pb-6">
            {/* ==========================================
                Breadcrumb
            ========================================== */}

            <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                <h1 className="sr-only">Tạo khóa học</h1>

                <Breadcrumb
                    items={[
                        {
                            label: "Khóa học",
                            to: "/teacher/courses",
                            icon: BookOpen,
                        },
                        {
                            label: "Tạo khóa học",
                        },
                    ]}
                />
            </div>

            {/* ==========================================
                Content
            ========================================== */}

            <div className="mx-auto w-full max-w-4xl p-2">
                {/* Form */}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                >
                    <div className="space-y-4">
                        {/* Title */}

                        <div>
                            <label
                                htmlFor="course-title"
                                className="mb-2 block text-sm font-semibold text-[var(--ink-2)]"
                            >
                                Tên khóa học
                                <span className="ml-1 text-[var(--danger)]">
                                    *
                                </span>
                            </label>

                            <input
                                id="course-title"
                                aria-invalid={Boolean(errors.title)}
                                aria-describedby={
                                    errors.title
                                        ? "course-title-error"
                                        : undefined
                                }
                                type="text"
                                value={title}
                                onChange={(e) =>
                                    setTitle(e.target.value)
                                }
                                placeholder="Ví dụ: Tiếng Lào giao tiếp cơ bản"
                                disabled={loading}
                                maxLength={150}
                                className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 disabled:bg-[var(--surface-2)]"
                            />

                            {errors.title && (
                                <p
                                    id="course-title-error"
                                    className="mt-1.5 text-xs text-[var(--danger)]"
                                >
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Description */}

                        <div>
                            <label
                                htmlFor="course-description"
                                className="mb-2 block text-sm font-semibold text-[var(--ink-2)]"
                            >
                                Mô tả
                            </label>

                            <textarea
                                id="course-description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                placeholder="Giới thiệu ngắn gọn về khóa học..."
                                disabled={loading}
                                rows={5}
                                maxLength={1000}
                                className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 disabled:bg-[var(--surface-2)]"
                            />
                        </div>

                        {/* ==========================================
                            Pricing & duration
                        ========================================== */}

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Price */}

                            <div>
                                <label
                                    htmlFor="course-price"
                                    className="mb-2 block text-sm font-semibold text-[var(--ink-2)]"
                                >
                                    Giá khóa học
                                </label>

                                <div className="relative">
                                    <input
                                        id="course-price"
                                        aria-invalid={Boolean(errors.price)}
                                        aria-describedby={
                                            errors.price
                                                ? "course-price-error"
                                                : undefined
                                        }
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={price}
                                        onChange={(e) =>
                                            setPrice(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0"
                                        disabled={loading}
                                        className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 pr-16 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 disabled:bg-[var(--surface-2)]"
                                    />

                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--faint)]">
                                        nghìn
                                    </span>
                                </div>

                                <p className="mt-1.5 text-xs text-[var(--faint)]">
                                    Nhập 0 nếu khóa học miễn phí.
                                </p>

                                {errors.price && (
                                    <p
                                        id="course-price-error"
                                        className="mt-1 text-xs text-[var(--danger)]"
                                    >
                                        {errors.price}
                                    </p>
                                )}
                            </div>

                            {/* Duration */}

                            <div>
                                <label
                                    htmlFor="course-duration"
                                    className="mb-2 block text-sm font-semibold text-[var(--ink-2)]"
                                >
                                    Thời hạn khóa học
                                </label>

                                <div className="relative">
                                    <input
                                        id="course-duration"
                                        aria-invalid={Boolean(
                                            errors.duration
                                        )}
                                        aria-describedby={
                                            errors.duration
                                                ? "course-duration-error"
                                                : undefined
                                        }
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={durationMonths}
                                        onChange={(e) =>
                                            setDurationMonths(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ví dụ: 3"
                                        disabled={loading}
                                        className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 pr-16 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 disabled:bg-[var(--surface-2)]"
                                    />

                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--faint)]">
                                        tháng
                                    </span>
                                </div>

                                <p className="mt-1.5 text-xs text-[var(--faint)]">
                                    Có thể để trống nếu không
                                    giới hạn thời hạn.
                                </p>

                                {errors.duration && (
                                    <p
                                        id="course-duration-error"
                                        className="mt-1 text-xs text-[var(--danger)]"
                                    >
                                        {errors.duration}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ==========================================
                            Thumbnail
                        ========================================== */}

                        <div>
                            <label
                                htmlFor="course-thumbnail"
                                className="mb-2 block text-sm font-semibold text-[var(--ink-2)]"
                            >
                                Ảnh khóa học
                            </label>

                            <input
                                id="course-thumbnail"
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                disabled={loading}
                                className="hidden"
                            />

                            {thumbnailPreview ? (
                                <div className="relative overflow-hidden rounded-2xl border border-[var(--line)]">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Xem trước ảnh khóa học"
                                        className="aspect-video w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            handleRemoveThumbnail
                                        }
                                        disabled={loading}
                                        className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed"
                                    >
                                        Xóa ảnh
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={loading}
                                    className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-3)] text-[var(--faint)] transition hover:border-[var(--brand)]/50 hover:bg-[var(--brand-solid)]/5 hover:text-[var(--brand-text)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ImagePlus size={32} />

                                    <span className="mt-2 text-sm font-medium">
                                        Chọn ảnh khóa học
                                    </span>

                                    <span className="mt-1 text-xs">
                                        PNG, JPG hoặc WEBP · tối đa
                                        5MB
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ==========================================
                        Actions
                    ========================================== */}

                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-[var(--line)] pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={loading}
                            className="
            rounded-full
            border border-[var(--line)]
            bg-[var(--surface)]
            px-5 py-2.5
            text-sm font-semibold
            text-[var(--muted)]
            transition
            hover:border-[var(--brand)]/30
            hover:bg-[var(--surface-3)]
            hover:text-[var(--brand-text)]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--brand)]/20
            disabled:cursor-not-allowed
            disabled:opacity-60
        "
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="
            rounded-full
            bg-[var(--brand-solid)]
            px-5 py-2.5
            text-sm font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-[var(--brand-solid)]
            hover:shadow-md
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--brand)]/30
            disabled:cursor-not-allowed
            disabled:opacity-60
            disabled:shadow-none
        "
                        >
                            {loading ? "Đang tạo..." : "Tạo khóa học"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseCreatePage;
