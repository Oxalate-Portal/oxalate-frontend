import { CSSProperties, useEffect, useState } from "react";
import axios from "axios";
import { Image } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useSession } from "../../session";

interface ProtectedImageProps {
    imageUrl: string;
    alt?: string;
    style?: CSSProperties;
    onRemove?: () => void;
    preview?: boolean;
}

export function ProtectedImage({ imageUrl, alt, style, onRemove, preview }: ProtectedImageProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const { userSession } = useSession();

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await axios.get(imageUrl, {
                    headers: {
                        Authorization: "Bearer " + userSession?.accessToken,
                    },
                    responseType: "blob", // Important to get the response as a Blob (binary data)
                });

                // Create a local URL for the downloaded file and set it as the source
                const imageBlob = new Blob([response.data]);
                const imageObjectURL = URL.createObjectURL(imageBlob);
                setImageSrc(imageObjectURL);
            } catch (error) {
                console.error("Error fetching image:", error);
            }
        };

        fetchImage();
    }, [imageUrl, userSession]);

    if (!imageSrc) {
        return <div>Loading image...</div>;
    }

    return (
            <div style={{ position: "relative", display: "inline-block" }}>
                {/* Display the image */}
                <Image
                        src={imageSrc}
                        alt={alt || "Protected content"}
                        style={style}
                        preview={(preview === undefined) ? true : preview}
                />

                {/* Conditionally render the remove icon if onRemove is provided */}
                {onRemove && (
                        <CloseCircleOutlined
                                onClick={onRemove}
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    fontSize: "24px",
                                    color: "black",
                                    cursor: "pointer",
                                }}
                        />
                )}
            </div>
    );
}
