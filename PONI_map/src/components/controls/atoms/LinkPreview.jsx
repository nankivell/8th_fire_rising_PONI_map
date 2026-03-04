import React from "react";

const LinkPreview = ({ url, title }) => {
  return (
    <div className="link-preview">
      {title && <h4 title={title}>{title}</h4>}
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
      {/* Add more preview UI here if you later fetch metadata/og tags */}
    </div>
  );
};

export default LinkPreview;