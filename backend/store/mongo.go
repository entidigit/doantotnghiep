package store

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DB struct {
	client   *mongo.Client
	dbName   string
	Agents   *mongo.Collection
	Batches  *mongo.Collection
	Events   *mongo.Collection
	Packages *mongo.Collection
	Listings *mongo.Collection
}

func Connect(uri string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	if err = client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	dbName := "tea_origin"
	db := client.Database(dbName)
	store := &DB{
		client:   client,
		dbName:   dbName,
		Agents:   db.Collection("agents"),
		Batches:  db.Collection("batches"),
		Events:   db.Collection("events"),
		Packages: db.Collection("packages"),
		Listings: db.Collection("listings"),
	}

	store.ensureIndexes(ctx)
	return store, nil
}

func (s *DB) ensureIndexes(ctx context.Context) {
	// agents: unique username
	s.Agents.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// batches: unique batchId, index on agentId
	s.Batches.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "batchId", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "batchHash", Value: 1}}},
		{Keys: bson.D{{Key: "agentId", Value: 1}}},
	})

	// events: index on batchId
	s.Events.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "batchId", Value: 1}},
	})

	// packages: unique packageHash, index on batchId
	s.Packages.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "packageHash", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "batchId", Value: 1}}},
	})

	// listings: index on agentId, status, createdAt
	s.Listings.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "agentId", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
	})
}

func (s *DB) Disconnect() {
	s.client.Disconnect(context.Background())
}
