import { useState } from "react";
import CardText from "./atoms/Text";
import CardTime from "./atoms/Time";
import CardButton from "./atoms/Button";
import CardCaret from "./atoms/Caret";
import CardCustom from "./atoms/CustomField";
import CardMedia from "./atoms/Media";

import { makeNiceDate, isEmptyString } from "../../common/utilities";
import hash from "object-hash";

// Helper function to check if a date is valid (not the epoch/invalid date marker)
// v2: Force rebuild to clear GitHub Pages cache
const isValidDate = (dateStr) => {
  if (!dateStr || dateStr === "-" || isEmptyString(dateStr)) return false;
  const date = new Date(dateStr);
  // Check if it's the Unix epoch (1969-12-31) which indicates an invalid date
  if (date.getFullYear() === 1969 && date.getMonth() === 11 && date.getDate() === 31) {
    return false;
  }
  return !isNaN(date.getTime());
};

export const generateCardLayout = {
  basic: ({ event }) => {
    const dateValue = event.datetime || event.date || ``;
    const rows = [
      [
        {
          kind: "title",
          value: event.title || event.description || ``,
        },
      ],
    ];

    // Only include date field if it's valid
    if (isValidDate(dateValue)) {
      rows.push([
        {
          kind: "text",
          title: "Impacted First Nation(s)",
          value: event.location || `—`,
        },
        {
          kind: "date",
          title: "Date of Designation",
          value: dateValue,
        },
      ]);
    } else {
      rows.push([
        {
          kind: "text",
          title: "Impacted First Nation(s)",
          value: event.location || `—`,
        },
      ]);
    }

    rows.push([{ kind: "line-break", times: 0.4 }]);
    rows.push([
      {
        kind: "text",
        title: "Summary",
        value: event.summary || ``,
        scaleFont: 1.1,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Companies Involved",
        value: event.companies || ``,
        scaleFont: 1.1,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Project Summary",
        value: event.project_summary || ``,
      },
    ]);

    return rows;
  },
  sourced: ({ event }) => {
    const dateValue = event.datetime || event.date || ``;
    const rows = [
      [
        {
          kind: "title",
          value: event.title || event.description || ``,
        },
      ],
    ];

    // Only include date field if it's valid
    if (isValidDate(dateValue)) {
      rows.push([
        {
          kind: "text",
          title: "Impacted First Nation(s)",
          value: event.location || `—`,
        },
        {
          kind: "date",
          title: "Date of Designation",
          value: dateValue,
        },
      ]);
    } else {
      rows.push([
        {
          kind: "text",
          title: "Impacted First Nation(s)",
          value: event.location || `—`,
        },
      ]);
    }

    rows.push([{ kind: "line-break", times: 0.4 }]);
    rows.push([
      {
        kind: "text",
        title: "Owners",
        value: event.Owners || ``,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Shareholders",
        value: event.Shareholders || ``,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Approval Stage",
        value: event.approval_stage || ``,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Commodity",
        value: event.commodity || ``,
      },
    ]);
    rows.push([
      {
        kind: "text",
        title: "Project Summary",
        value: event.project_summary || ``,
      },
    ]);
    rows.push([
      {
        kind: "sources",
        values: event.sources.flatMap((source) => [
          source.paths.map((p) => ({
            kind: "media",
            title: "Media",
            value: [
              { src: p, title: null, graphic: event.graphic === "TRUE" },
            ],
          })),
        ]),
      },
    ]);

    return rows;
  },
};

export const Card = ({
  content = [],
  isLoading = true,
  cardIdx = -1,
  onSelect = () => {},
  sources = [],
  isSelected = false,
  language = "en-US",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  // NB: should be internationalized.
  const renderTime = (field) => (
    <CardTime
      language={language}
      timelabel={makeNiceDate(field.value)}
      {...field}
    />
  );

  const renderCaret = () =>
    sources.length === 0 && (
      <CardCaret toggle={() => toggle()} isOpen={isOpen} />
    );

  const renderMedia = ({ media, idx, cardIdx }) => {
    return (
      <CardMedia
        key={idx}
        cardIdx={cardIdx}
        src={media.src}
        title={media.title}
        graphic={media.graphic}
      />
    );
  };

  function renderField(field, cardIdx) {
    switch (field.kind) {
      case "media":
        return (
          <div className="card-cell">
            {field.value.map((media, idx) => {
              return renderMedia({ media, idx, cardIdx });
            })}
          </div>
        );
      case "line":
        return (
          <div style={{ height: `1rem`, width: `100%` }}>
            <hr />
          </div>
        );
      case "line-break":
        return (
          <div style={{ height: `${field.times || 1}rem`, width: `100%` }} />
        );
      case "item":
        // this is like a span
        return null;
      case "markdown":
        return <CardCustom {...field} />;
      case "tag":
        return (
          <div
            className="card-cell m0"
            style={{
              textTransform: `uppercase`,
              fontSize: `.8em`,
              lineHeight: `.8em`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: `flex-${field.align || `start`}`,
              }}
            >
              {field.value}
            </div>
          </div>
        );
      case "button":
        return (
          <div className="card-cell">
            {field.title && <h4>{field.title}</h4>}
            {/* <div className="card-row"> */}
            {field.value.map((t, idx) => (
              <CardButton key={`card-button-${idx}`} {...t} />
            ))}
            {/* </div> */}
          </div>
        );
      case "title":
        return (
          !isEmptyString(field.value) && (
            <div className="card-cell">
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "calc(1em + 2pt)",
                  lineHeight: 1.2,
                }}
              >
                {field.value}
              </div>
            </div>
          )
        );
      case "text":
        return !isEmptyString(field.value) && <CardText {...field} />;
      case "date":
        return isEmptyString(field.value) ? null : renderTime(field);
      case "links":
        return (
          <div className="card-cell">
            {field.title && <h4>{field.title}</h4>}
            <div className="card-row m0">
              {field.value.map(({ text, href }, idx) => (
                <a href={href} target="_blank" rel="noopener noreferrer"> key={`card-links-url-${idx}`}
                  {text}
                </a>
              ))}
            </div>
          </div>
        );
      case "list":
        // Only render if some of the list's strings are non-empty
        const shouldFieldRender =
          !!field.value.length &&
          !!field.value.filter((s) => !isEmptyString(s)).length;
        return shouldFieldRender ? (
          // <div className="card-cell">
          <div>
            {field.title && <h4>{field.title}</h4>}
            <div className="card-row m0">
              {field.value.map((t, idx) => (
                <CardText key={`card-list-text-${idx}`} value={t} {...t} />
              ))}
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  }

  function renderRow(row, cardIdx, salt) {
    return (
      <div className="card-row" key={hash({ ...row, salt })}>
        {row.map((field) => (
          // src by src meaning wrapGrahpic must be called around a map of renderField for sources
          <span key={hash({ ...field, row: row })}>
            {renderField(field, cardIdx)}
          </span>
        ))}
      </div>
    );
  }

  // TODO: render afterCaret appropriately from props
  sources = [];

  return (
    <li
      key={hash(content)}
      className={`event-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      {content.map((row, idx) => {
        if (row[0].kind === "sources" && row[0].values.length > 0) {
          return (
            <div key={idx}>
              <details open={true}>
                <summary>
                  <span className="summary-line"></span>
                  <span className="summary-text">
                    <span className="summary-show">Show</span>{" "}
                    <span className="summary-hide">Hide</span> sources (
                    {row[0].values.length})
                  </span>
                  <span className="summary-line"></span>
                </summary>
                {row[0].values.map((r) => renderRow(r, cardIdx, row[0]))}
              </details>
            </div>
          );
        } else return renderRow(row, cardIdx);
      })}

      {/* {isOpen && (
        <div className="card-bottomhalf">
          {sources.map(() => (
            <div className="card-row"></div>
          ))}
        </div>
      )} */}
      {sources.length > 0 ? renderCaret() : null}
    </li>
  );
};
