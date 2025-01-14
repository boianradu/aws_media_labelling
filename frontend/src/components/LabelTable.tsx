import React from "react";

interface LabelTableProps {
    data: { [key: string]: string | number | boolean | null | undefined };
}

const LabelTable: React.FC<LabelTableProps> = ({ data }) => {
    let labels = data.labels;
    if (!labels || !Array.isArray(labels)) {
        return <div>No labels found.</div>;
    }
    return (
        <table className="labelTable">
            <thead>
                <tr>
                    <th >Label Name</th>
                    <th >Confidence</th>
                </tr>
            </thead>
            <tbody>
                {labels.map((label, index) => (
                    <tr key={index}>
                        <td>{label.Name}</td>
                        <td>{label.Confidence}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default LabelTable;