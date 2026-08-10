export const STORAGE_KEYS = {
  USER: "auth_user",
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
};

export const translateApiMessage = (code: string) => {
  if (!code) return "An unexpected error occurred. Please try again.";
  const messages: { [key: string]: string } = {
    VALIDATION_ERROR: "Please check your input and try again.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    USER_NOT_FOUND: "No account found with this email.",
  };
  return messages[code] || code;
};

export const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeUserPayload = (user: any): Record<string, any> | null => {
  if (!isObject(user)) return null;

  const normalized = { ...user };

  if (normalized.Email && !normalized.email) {
    normalized.email = normalized.Email;
  }
  if (normalized.PhoneNumber && !normalized.phone) {
    normalized.phone = normalized.PhoneNumber;
  }
  if (normalized.phone && !normalized.phoneNumber) {
    normalized.phoneNumber = normalized.phone;
  }
  if (normalized.Boi && !normalized.bio) {
    normalized.bio = normalized.Boi;
  }
  if (normalized.bio && !normalized.Boi) {
    normalized.Boi = normalized.bio;
  }

  return normalized;
};

export const extractUserPayload = (result: any): Record<string, any> | null => {
  if (!isObject(result)) return null;

  if (isObject(result.data?.user))
    return normalizeUserPayload(result.data.user);
  if (isObject(result.user)) return normalizeUserPayload(result.user);

  if (
    isObject(result.data) &&
    (result.data.email ||
      result.data.Email ||
      result.data.name ||
      result.data.fullName ||
      result.data.photo ||
      result.data.avatar ||
      result.data.profilePic ||
      result.data.image)
  ) {
    return normalizeUserPayload(result.data);
  }

  return null;
};

export const headersToRecord = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  return { ...(headers as Record<string, string>) };
};

export const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("Failed to convert URI to Blob"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};
