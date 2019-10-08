const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const request = require("request");
const config = require("config");
const Post = require("../../models/Post");

// @route -- GET -- api/profile/me
// @desc -- -- Get users profile based on _id
// @access -- -- Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for this user." });
    }

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

// @route -- POST -- api/profile
// @desc -- -- Create or update a user profile
// @access -- -- Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required.")
        .not()
        .isEmpty(),
      check("skills", "Skills are required.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // Build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    // Build social object

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // Update the profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // Create a profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send("Internal server error.");
    }
  }
);

// @route -- GET -- api/profile
// @desc -- -- Get all profiles
// @access -- -- Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

// @route -- GET -- api/profile/user/:user_id
// @desc -- -- Get profile by user ID
// @access -- -- Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found." });

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    if (e.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.status(500).send("Internal server error.");
  }
});

// @route -- DELETE -- api/profile
// @desc -- -- Delete profile, user and posts
// @access -- -- Private
router.delete("/", auth, async (req, res) => {
  try {
    // Remove user's posts
    await Post.deleteMany({ user: req.user.id });
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User removed." });
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

// @route -- PUT -- api/profile/experience
// @desc -- -- Add profile experience
// @access -- -- Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required.")
        .not()
        .isEmpty(),
      check("company", "Company is required.")
        .not()
        .isEmpty(),
      check("from", "Start date is required.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send("Internal server error.");
    }
  }
);

// @route -- DELETE -- api/profile/experience/:exp_id
// @desc -- -- Delete experience form profile
// @access -- -- Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // console.log(req);
    const profile = await Profile.findOne({ user: req.user.id });
    // Get the remove index
    const experienceIds = profile.experience.map(item => item.id.toString());
    const removeIndex = experienceIds.indexOf(req.params.exp_id);

    if (removeIndex === -1) {
      return res.status(500).json({ msg: "Internal server error." });
    } else {
      // console.log("experienceIds", experienceIds);
      // console.log("typeof experienceIds", typeof experienceIds);
      // console.log("req.params", req.params);
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.status(200).json(profile);
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

// @route -- PUT -- api/profile/education
// @desc -- -- Add profile education
// @access -- -- Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required.")
        .not()
        .isEmpty(),
      check("degree", "Degree is required.")
        .not()
        .isEmpty(),
      check("from", "Start date is required.")
        .not()
        .isEmpty(),
      check("fieldofstudy", "Field of study date is required.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send("Internal server error.");
    }
  }
);

// @route -- DELETE -- api/profile/education/:edu_id
// @desc -- -- Delete education form profile
// @access -- -- Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get the remove index
    const educationIds = profile.education.map(item => item.id.toString());

    const removeIndex = educationIds.indexOf(req.params.edu_id);

    if (removeIndex === -1) {
      return res.status(500).json({ msg: "Internal server error." });
    } else {
      profile.education.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

// @route -- GET -- api/profile/github/:username
// @desc -- -- Get user's repositories from Github
// @access -- -- Public
router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };
    request(options, (err, response, body) => {
      if (err) console.error(err);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github profile found." });
      }
      res.json(JSON.parse(body));
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error.");
  }
});

module.exports = router;
