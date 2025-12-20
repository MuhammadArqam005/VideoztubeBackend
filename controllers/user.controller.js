import User from "../models/user.model.js"
import { deleteFileCloudinary } from "../utils/cloudinary.js";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false
    });
    return { accessToken, refreshToken }
  }
  catch {
    throw new Error("Cannot generate access and refresh token")
  }
}

const registerUser = async (req, res) => {
  try {
    let { fullName, email, username, password, avatar, coverImage } = req.body;
    const avatarUrl = await avatar.split("/");
    const avatarName = await avatarUrl[avatarUrl.length - 1].split(".")[0];
    let coverImageName;
    if (coverImage) {
      const coverImageUrl = await coverImage.split("/")
      coverImageName = await coverImageUrl[coverImageUrl.length - 1].split(".")[0]
    }
    if (
      [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
      await deleteFileCloudinary(avatarName, "image")
      if (coverImage) await deleteFileCloudinary(coverImageName, "image")
      return res.status(404).json({
        err: "Please Enter a valid credentials"
      })
    }
    const isUserExist = await User.findOne({
      $or: [{ username }, { email }]
    })
    if (isUserExist) {
      await deleteFileCloudinary(avatarName, "image")
      if (coverImage) await deleteFileCloudinary(coverImageName, "image")
      return res.status(404).json({
        err: "Please Enter a valid credentials"
      })
    }
    const user = await User.create({
      fullName,
      username,
      email,
      password,
      avatar: avatar,
      coverImage: coverImage || ""
    })
    const createdUser = await User.findById(user._id).select("-password")
    return res.status(200).json({
      success: "Registered successfully",
      createdUser
    })
  }
  catch (err) {
    res.status(500).json({
      err: err.message
    })
  }
}

const login = async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username) {
      return res.status(400).json({
        err: "Enter valid credentials"
      })
    }
    const user = await User.findOne({
      $or: [{
        username: username.trim()
      },
      {
        email: username.trim()
      }]
    })
    if (!user) {
      return res.status(400).json({
        err: "Enter valid credentials"
      })
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        err: "Enter valid credentials"
      })
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const options = {
      httpOnly: false,
      sameSite : 'None',
      secure: true
    }
    const loginUser = await User.findById(user._id).select("-password -refreshToken")
    res.status(200).cookie("accesstoken", accessToken, options).cookie("refreshtoken", refreshToken, options).cookie("loginuser", loginUser, options).json({
      loginUser,
      accessToken,
      refreshToken
    })
  }
  catch (err) {
    return res.status(500).json({
      err: err.message
    })
  }
}
const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1
    }
  }, {
    new: true
  });

  const options = {
      httpOnly: false,
      sameSite : 'None',
      secure: true
    }

  return res.status(200).clearCookie('accesstoken', options).clearCookie('refreshtoken', options).clearCookie("loginuser", options).json('Logout Successfully')



}

const getUserDetails = async (req, res) => {
  try {
    const { username } = req.params
    const userDetails = await User.aggregate([
      {
        $match: { username: username }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribes"
        }
      },
      {
        $addFields: {
          isSubscribe: {
            $in: [
              req.user._id,
              {
                $map: {
                  input: "$subscribers",
                  as: "sub",
                  in: "$$sub.subscriber"
                }
              }
            ]
          },
          subscribersCount: {
            $size: "$subscribers"
          },
          channelSubscribedToCount: {
            $size: "$subscribes"
          }
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscribersCount: 1,
          channelSubscribedToCount: 1,
          isSubscribe: 1
        }
      }
    ])
    if (userDetails.length < 1) {
      throw new Error("Not Found")
    }
    return res.status(200).json(userDetails);
  }
  catch (err) {
    res.status(404).json({
      err: err.message
    })
  }
}
const getEditProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("username fullName avatar coverImage")
    if (!user) {
      return res.status(404).json("user not found")
    }
    return res.status(200).json(user)
  }
  catch (err) {
    res.status(500).json("internal Error")
  }
}
//update if coverImage or avatar or username or fullname
const channelUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
    const { newUsername, fullName, avatar, coverImage } = req.body;
    let avatarName;
    if(avatar){
      const avatarUrl = await avatar.split("/");
      avatarName = await avatarUrl[avatarUrl.length - 1].split(".")[0];
    }
    let coverImageName;
    if (coverImage) {
      const coverImageUrl = await coverImage.split("/")
      coverImageName = await coverImageUrl[coverImageUrl.length - 1].split(".")[0]
    }
    if (newUsername) {
      const isUserExist = await User.findOne({
        username: newUsername
      });
      if (isUserExist) {
        await deleteFileCloudinary(avatarName, "image")
        if (coverImage) await deleteFileCloudinary(coverImageName, "image")
        return res.status(400).json("Username already exists")
      }
      user.username = newUsername;
    }
    if (fullName) {
      user.fullName = fullName;
    }
    if (avatar) {
      const avatarFile = await user.avatar.split("/");
      const avatarName = await avatarFile[avatarFile.length - 1].split(".")[0]
      const deletedAvatar = await deleteFileCloudinary(avatarName, "image")
      if (deletedAvatar.result == 'ok') {
        user.avatar = avatar;
      }
    }
    if (coverImage) {
      if (user.coverImage.length) {
        const coverImageFile = await user.coverImage.split("/");
        const coverImageName = await coverImageFile[coverImageFile.length - 1].split(".")[0]
        const deletedCoverImage = await deleteFileCloudinary(coverImageName, "image")
      }
      user.coverImage = coverImage;
    }
    const options = {
      httpOnly: false,
      sameSite : 'None',
      secure: true
    }
    const updatedUser = await user.save({
      validateBeforeSave: false
    })
    return res.status(200).cookie("loginuser", updatedUser, options).json(updatedUser)
  }
  catch (err) {
    res.status(500).json({
      err: err.message
    })
  }
}

//update if password 
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const user = await User.findById(id)
    if (!password) {
      return res.status(400).json("Enter Valid Credentials")
    }
    user.password = password
    const updatedPasswordUser = await user.save({
      validateBeforeSave: false
    });
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(updatedPasswordUser._id);
    const updatedUser = await User.findById(updatedPasswordUser._id).select("-password -refreshtoken")

    const options = {
      httpOnly: false,
      sameSite : 'None',
      secure: true
    }

    res.status(200).cookie("accesstoken", accessToken, options).cookie("refreshtoken", refreshToken, options).cookie("loginuser", updatedUser, options).json({
      updatedUser,
      accessToken,
      refreshToken
    })

  }
  catch (err) {
    res.status(500).json({
      err: err.message
    })
  }
}

// delete coverImage
const deleteCoverImage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
    const coverImageFile = await user.coverImage.split("/");
    const coverImageName = await coverImageFile[coverImageFile.length - 1].split(".")[0]
    const deletedCoverImage = await deleteFileCloudinary(coverImageName, "image")

    user.coverImage = "";

    const updatedUser = await user.save({
      validateBeforeSave: false
    })

    return res.status(200).json(updatedUser)

  }
  catch (err) {
    res.status(500).json({
      err: err.message
    })
  }
}

const getWatchHistory = async (req, res) => {
  try {
    const { page, limit } = req.query
    const history = await User.aggregate([
      {
        $match: {
          _id: req.user._id
        }
      },
      {
        $lookup: {
          from: "videos",
          foreignField: "_id",
          localField: "watchHistory",
          let: {
            "videos_id": "$watchHistory",

          },
          as: "watchedVideos",
          pipeline: [{
            "$addFields": {
              index: {
                $indexOfArray: [
                  "$$videos_id",
                  "$_id"
                ]
              },

            }
          },
          {
            "$sort": {
              index: 1
            }
          }, {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{
                $project: {
                  username: 1
                }
              }]
            }
          }]
        }
      },
      {
        $project: {
          watchedVideos: 1
        }
      }
    ])
    const userHistory = history?.[0]?.watchedVideos
    // Pages Defines length of pages (its just copy not send) how many pages
    const pages = new Array(Math.ceil(userHistory.length / limit))
    // iterate playlist item
    let k = 0;
    // Pages defines length of pages (its actual pages) how many pages
    const videos = new Array(pages.length);
    for (let i = 0; i < pages.length; i++) {
      // pages[i] defines length of page using limit how many items
      pages[i] = new Array(limit)
      // actual data initialiize

      videos[i] = new Array()
      for (let j = 0; j < limit; j++, k++) {
        // page[i][j] = item to checked undefined
        pages[i][j] = userHistory[k]
        if (userHistory[k]) {
          //then videos[i] add item
          videos[i].push(pages[i][j])
        }
      }
    }
    const data = {
      docs: videos[page - 1],
      totalDocs: userHistory.length,
      hasNext: pages.length > page
    }
    if (!history) {
      return res.status(400).json("Not valid");
    }
    return res.status(200).json(data)
  }
  catch (err) {
    return res.status(200).json(err.message)
  }
}
export { registerUser, login, logout, getUserDetails, getWatchHistory, channelUpdate, changePassword, deleteCoverImage, getEditProfile };
