import { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import FavoritesTab from "../components/FavoritesTab";
import ScoresTab from "../components/ScoresTab";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
const { width } = Dimensions.get("window");

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<"favorites" | "scores">("favorites");

  return (
    <View className="flex-1 bg-[#ED9277] pt-28">
      <View className="flex-row justify-between pb-2">
        <TouchableOpacity
          onPress={() => setActiveTab("favorites")}
          className={`flex-1 p-2 rounded-lg mx-1 ${activeTab === "favorites" ? "bg-[#FFD700]" : "bg-[#FFD700]/10"}`}
        >
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons
              name="heart"
              size={activeTab === "favorites" ? width * 0.08 : width * 0.06}
              color={activeTab === "favorites" ? "#800000" : "#ffffff"}
            />
            <Text className={`text-black font-bold text-center ml-2 ${activeTab === "favorites" ? "text-xl" : "text-lg"}`}>
              Favoriler
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("scores")}
          className={`flex-1 p-2 rounded-lg mx-1 ${activeTab === "scores" ? "bg-[#FFD700]" : "bg-[#FFD700]/10"}`}
        >
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons
              name="chart-line"
              size={activeTab === "scores" ? width * 0.08 : width * 0.06}
              color={activeTab === "scores" ? "#800000" : "#ffffff"}
            />
            <Text className={`text-black font-bold text-center ml-2 ${activeTab === "scores" ? "text-xl" : "text-lg"}`}>
              Skorlarım
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {activeTab === "favorites" ? <FavoritesTab /> : <ScoresTab />}
    </View>
  );
};

export default ProfileScreen;