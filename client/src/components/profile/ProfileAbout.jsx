import React, { Fragment } from "react";
import PropTypes from "prop-types";

function ProfileAbout(props) {
  const { profile } = props;
  const {
    bio,
    skills,
    user: { name }
  } = profile;

  return (
    <div className="profile-about bg-light p-2">
      {bio && (
        <Fragment>
          <h2 className="text-primary">
            The biography of {name.trim().split(" ")[0]}
          </h2>
          <p>{bio}</p>
          <div className="line" />
        </Fragment>
      )}
      <h2 className="text-primary">Skill Set</h2>
      <div className="skills">
        {skills.map((skill, index) => (
          <div className="p-1" key={index}>
            <i className="fas fa-check" /> {skill}
          </div>
        ))}
      </div>
    </div>
  );
}

ProfileAbout.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileAbout;
