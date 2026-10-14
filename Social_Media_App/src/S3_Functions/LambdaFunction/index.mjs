import { MongoClient, ObjectId } from "mongodb";

async function dbConnection() {
  try {
    const client = new MongoClient("mongodb+srv://maryammamdouh2002_db:Maryam%402002@cluster0.duofh22.mongodb.net/?appName=Cluster0/SocialMediaDB");
    await client.connect();

    console.log("DB connected");

    return client;
  } catch (error) {
    console.log("failed to connect to DB");
  }
}


export const handler = async (event) => {
  try {
    const client = await dbConnection();

    const db = client.db("SocialMediaDB");
    const userCollection = db.collection("users");

    for (const record of event.Records) {
      console.log({s3: record.s3});
      console.log({object: record.s3.object});
      console.log({c: record.s3.object.key});
    
      const key = decodeURIComponent(record.s3.object.key);
      console.log("file uploaded: " + key);

      const userId = key.split("/")[2];
      const fileType = key.split("/")[3]; // profilePic or coverPic

      // const result = await userCollection.updateOne(
      //   {
      //     _id: ObjectId.createFromHexString(userId),
      //   },
      //   {
      //     $set: { profilePic: key },
      //   },
      // );

      if (fileType === "profilePic") {
        result = await userCollection.updateOne(
          {
            _id: ObjectId.createFromHexString(userId),
          },
          {
            $set: { profilePic: key },
          },
        );
      } else if (fileType === "coverPic") {
        result = await userCollection.updateOne(
          {
            _id: ObjectId.createFromHexString(userId),
          },
          {
            $addToSet: { coverPic: key },
          },
        );
      }

      console.log(result);
    }
  } catch (error) {
    console.log("err in lambda function: " + error);
  }
};

handler({
  Records: [
    {
      s3: {
        object: {
          key: "social-media-app/user/6a2bd521567e78c277119fbd/coverPic/covertest.png",
        },
      },
    },
  ],
});