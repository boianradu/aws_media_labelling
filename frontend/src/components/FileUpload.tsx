
import React, { useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import { SERVER } from "../utils/constants"
// Import FilePond plugins (if needed)
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginMediaPreview from 'filepond-plugin-media-preview';
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import LabelTable from "./LabelTable";

registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview, FilePondPluginMediaPreview);

const FileUpload: React.FunctionComponent = () => {
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
    const [serverResponse, setServerResponse] = useState<{ [key: string]: string | number | boolean | null | undefined } | null>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    return (
        <div className="container">
            <FilePond
                className="filePond"
                allowMultiple={false}
                files={files}
                onupdatefiles={setFiles}
                credits={false}
                allowRevert={true}
                allowRemove={true}
                acceptedFileTypes={["image/*", "video/*"]}
                server={{
                    url: SERVER,
                    process: {
                        url: '/api/upload', // API endpoint for processing uploads
                        method: 'POST',
                        onload: (response) => {
                            console.log('Upload successful:', response);
                            const responseData = JSON.parse(response);
                            setUploadedFileUrl(responseData.fileUrl);

                            if (responseData.status === 200) {
                                console.log('Upload successful:', responseData);
                                setUploadedFileUrl(responseData.fileUrl);
                                setServerResponse(responseData);
                                setErrorMessage(null);
                            } else if (responseData.status === 202) {
                                console.log('File already exists:', responseData);
                                setUploadedFileUrl(responseData.fileUrl);
                                setServerResponse(responseData);
                                setErrorMessage(responseData.message);
                            } else if (responseData.status === 413) {
                                console.error('Error by size of the file:', responseData);
                                setErrorMessage(responseData.message);
                            } else if (responseData.status === 500) {
                                console.error('Error in labels:', responseData);
                                setErrorMessage(responseData.message);
                            } else {
                                console.error('Unknown response:', responseData);
                                setErrorMessage("An unknown error occurred.");
                            }

                            return response;
                        },
                        onerror: (response) => {
                            console.error('Upload failed:', response);
                        },
                    },
                    revert: (load) => {
                        setUploadedFileUrl(null);
                        setServerResponse(null);
                        setErrorMessage(null)
                        setFiles([])
                        load();
                    },
                }}
                name="file"
                labelIdle='Drag & Drop your file or <span class="filepond--label-action">Browse</span>'
            />
            {uploadedFileUrl && (
                <div className="uploaded-media">
                    {uploadedFileUrl.endsWith(".mp4") ? (
                        <video controls src={uploadedFileUrl} />
                    ) : (
                        <img src={uploadedFileUrl} alt="Uploaded" />
                    )}
                </div>
            )}

            {serverResponse && (
                <div className="server-response">
                    <LabelTable data={serverResponse} />
                </div>
            )}

            {errorMessage && (
                <div className="error-message" style={{ color: "red", marginTop: "10px" }}>
                    <strong>Message:</strong> {errorMessage}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
