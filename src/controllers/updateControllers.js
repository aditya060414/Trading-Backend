const User = require("../models/UserModel");


module.exports.changeUsername = async (req, res) => {
    const username = req.body.username?.trim();
    const  id  = req.user.id;

    if (!username) {
        return res.status(400).json({ message: "Username is required." });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { $set: { username } }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(200).json({ message: "Updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update username.", error: error.message });
    }

}

module.exports.changePassword = async (req, res) => {
    res.send("change password");
}