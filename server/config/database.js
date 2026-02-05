import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // MongoDB driver options
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create time-series collection for telemetry if it doesn't exist
    const db = conn.connection.db;
    const collections = await db.listCollections({ name: 'telemetries' }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection('telemetries', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'clientId',
          granularity: 'hours'
        }
      });
      console.log('✅ Time-series collection created for telemetry');
    }
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
