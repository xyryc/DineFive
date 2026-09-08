import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { normalizeImageUri } from "@/utils/userAvatar";

const DEFAULT_AVATAR = require("@/assets/images/user-icon.jpg");

interface Review {
  _id?: string;
  id?: string;
  customerId?: {
    _id?: string;
    fullName?: string;
    profilePic?: string;
    googlePicture?: string;
    avatar?: string;
  };
  name?: string;
  fullName?: string;
  profileImage?: string;
  profilePic?: string;
  customerProfile?: string;
  avatar?: string;
  image?: string;
  rating: number;
  comment?: string;
  description?: string;
  createdAt?: string;
  date?: string;
  updatedAt?: string;
  reply?: {
    comment?: string;
    createdAt?: string;
  } | null;
}

interface CustomerReviewsProps {
  reviews?: Review[];
}

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const joinName = (...values: unknown[]) => {
  const parts = values
    .filter((value) => typeof value === "string")
    .map((value) => String(value).trim())
    .filter(Boolean);

  return parts.join(" ").trim();
};

const getReviewKey = (review: any, index: number) =>
  pickString(
    review?._id,
    review?.id,
    review?.createdAt,
    review?.customerId?._id,
    review?.orderId?._id,
    review?.orderId?.customerId?._id,
    review?.comment,
  ) || `review-${index}`;

const getReviewerName = (review: any) =>
  pickString(
    review?.fullName,
    review?.name,
    review?.customerId?.fullName,
    review?.customerId?.name,
    joinName(review?.customerId?.firstName, review?.customerId?.lastName),
    review?.customer?.fullName,
    review?.customer?.name,
    joinName(review?.customer?.firstName, review?.customer?.lastName),
    review?.author?.fullName,
    review?.author?.name,
    joinName(review?.author?.firstName, review?.author?.lastName),
    review?.customerName,
    review?.userName,
    review?.user?.fullName,
    review?.user?.name,
    joinName(review?.user?.firstName, review?.user?.lastName),
    review?.orderId?.customerId?.fullName,
    review?.orderId?.customerId?.name,
    joinName(
      review?.orderId?.customerId?.firstName,
      review?.orderId?.customerId?.lastName,
    ),
    review?.orderId?.userId?.fullName,
    review?.orderId?.userId?.name,
    joinName(
      review?.orderId?.userId?.firstName,
      review?.orderId?.userId?.lastName,
    ),
  ) || "Anonymous User";

const getReviewerImage = (review: any) =>
  normalizeImageUri(
    pickString(
      review?.profileImage,
      review?.profilePic,
      review?.avatar,
      review?.image,
      review?.photo,
      review?.customerProfile,
      review?.userAvatar,
      review?.customerAvatar,
      review?.googlePicture,
      review?.customerId?.profilePic,
      review?.customerId?.profilePicture,
      review?.customerId?.googlePicture,
      review?.customerId?.avatar,
      review?.customerId?.image,
      review?.customerId?.photo,
      review?.customer?.profilePic,
      review?.customer?.profilePicture,
      review?.customer?.googlePicture,
      review?.customer?.avatar,
      review?.customer?.image,
      review?.author?.profilePic,
      review?.author?.avatar,
      review?.user?.profilePic,
      review?.user?.googlePicture,
      review?.user?.avatar,
      review?.orderId?.customerId?.profilePic,
      review?.orderId?.customerId?.profilePicture,
      review?.orderId?.customerId?.googlePicture,
      review?.orderId?.customerId?.avatar,
      review?.orderId?.customerId?.image,
      review?.orderId?.userId?.profilePic,
      review?.orderId?.userId?.avatar,
      review?.orderId?.userId?.image,
    ),
  );

const getReviewComment = (review: any) => {
  const directComment = pickString(
    review?.comment,
    review?.description,
    review?.review,
    review?.message,
    review?.text,
    review?.details,
    review?.content,
  );

  if (directComment) return directComment;

  if (
    typeof review?.comment === "number" ||
    typeof review?.comment === "boolean"
  ) {
    return String(review.comment);
  }

  if (
    typeof review?.description === "number" ||
    typeof review?.description === "boolean"
  ) {
    return String(review.description);
  }

  if (
    typeof review?.review === "number" ||
    typeof review?.review === "boolean"
  ) {
    return String(review.review);
  }

  return "No comment provided.";
};

const getReviewDate = (review: any) => {
  const rawDate = pickString(
    review?.createdAt,
    review?.date,
    review?.updatedAt,
    review?.created_at,
  );
  if (!rawDate) return "Recently";

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return "Recently";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getReviewRating = (review: any) => {
  const parsed = Number(review?.rating ?? review?.rate ?? review?.stars);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(5, parsed));
};

const ReviewerAvatar = ({ review }: { review: any }) => {
  const uri = getReviewerImage(review);
  const [loadError, setLoadError] = useState(false);

  return (
    <View className="w-12 h-12 rounded-full overflow-hidden bg-[#F1F1EF] items-center justify-center border border-gray-100">
      <Image
        source={!uri || loadError ? DEFAULT_AVATAR : { uri }}
        style={{ width: "100%", height: "100%", borderRadius: 100 }}
        contentFit="cover"
        onError={() => setLoadError(true)}
      />
    </View>
  );
};

export const CustomerReviews = ({ reviews = [] }: CustomerReviewsProps) => {
  if (reviews.length === 0) {
    return (
      <View className="mb-4 items-center py-4">
        <Text className="text-gray-400 font-body text-sm italic">
          No reviews yet for this item.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-lg font-heading-semibold text-[#1F2A33] mb-4">
        Customer Reviews
      </Text>
      {reviews.map((review, index) => (
        <View
          key={getReviewKey(review, index)}
          className="flex-row items-start mb-6"
        >
          <ReviewerAvatar review={review} />
          <View className="flex-1 ml-4">
            <Text className="text-sm font-body-semibold text-[#1F2A33] mb-1">
              {getReviewerName(review)}
            </Text>

            <View className="flex-row items-center mb-2">
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={14}
                    color={
                      star <= getReviewRating(review) ? "#FFC107" : "#E5E7EB"
                    }
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text className="text-xs font-body text-gray-400 ml-2">
                {getReviewDate(review)}
              </Text>
            </View>

            <Text className="text-[#7A7A7A] font-body text-sm leading-5">
              {getReviewComment(review)}
            </Text>

            {review?.reply?.comment ? (
              <View className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#F5C518]">
                <Text className="text-xs font-body-semibold text-[#1F2A33] mb-0.5">
                  Restaurant Response
                </Text>
                <Text className="text-xs text-gray-500 font-body">
                  {review.reply.comment}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
};
