export const TRIGRAM_NATURES: Record<number, { name: string, nature: string, meaning: string }> = {
  0: { name: "Càn (Thiên/Trời)", nature: "Cương kiện", meaning: "Đại diện cho sự vận động không ngừng, cương cường, người cha, đấng minh quân, sức mạnh nguyên thủy." },
  1: { name: "Đoài (Trạch/Đầm)", nature: "Hòa duyệt", meaning: "Đại diện cho sự vui vẻ, mềm mỏng bên ngoài, lời nói êm tai, thiếu nữ, hồ nước tưới tắm vạn vật." },
  2: { name: "Ly (Hỏa/Lửa)", nature: "Sáng sủa", meaning: "Đại diện cho trí tuệ sáng suốt, rực rỡ, trung nữ, sự bám víu và nương tựa rực sáng như ngọn lửa." },
  3: { name: "Chấn (Lôi/Sấm)", nature: "Chấn động", meaning: "Đại diện cho sấm sét, sự khởi đầu mạnh mẽ, thức tỉnh, trưởng nam, hành động dứt khoát và rung chuyển." },
  4: { name: "Tốn (Phong/Gió)", nature: "Nhún nhường", meaning: "Đại diện cho sự thuận theo, thâm nhập mọi ngóc ngách, mềm mại, trưởng nữ, sự lan tỏa trường kỳ." },
  5: { name: "Khảm (Thủy/Nước)", nature: "Hiểm nguy", meaning: "Đại diện cho gian truân, hiểm sâu, vực thẳm, thứ nam, trí tuệ sâu thẳm ẩn giấu bên trong dòng chảy." },
  6: { name: "Cấn (Sơn/Núi)", nature: "Ngưng nghỉ", meaning: "Đại diện cho sự dừng lại đúng lúc, vững chãi tĩnh lặng, thiếu nam, trấn giữ và ổn định hoàn cảnh." },
  7: { name: "Khôn (Địa/Đất)", nature: "Nhu thuận", meaning: "Đại diện cho lòng bao dung bao la, sự chở che, nuôi dưỡng, người mẹ hiền dung chứa muôn loài." }
};

export const HEXAGRAM_RELATIONS: Record<string, { connection: string, deepMeaning: string }> = {
  "0,0": {
    connection: "Trời (Càn) trên Trời (Càn), thiên thể vận hành liên tục không một giây ngưng nghỉ.",
    deepMeaning: "Thể hiện nguyên lý 'Nguyên Hanh Lợi Trinh' - gốc của vạn vật. Nhắc nhở người quân tử phải bắt chước sự cương kiện của đất trời, nỗ lực tự cường, không bao giờ chùn bước trước nghịch cảnh để đạt tới đỉnh cao."
  },
  "0,1": {
    connection: "Trời (Càn) ở trên, Đầm/Hồ (Đoài) ở dưới thấp ngước lên nhìn trời.",
    deepMeaning: "Trên dưới phân minh, kẻ dưới biết tôn trọng nề nếp, vui vẻ (Đoài) mà tuân theo lễ giáo của kẻ trên (Càn). Điềm báo dẫu có đi ngay sau đuôi cọp dữ rập rình cũng không bị cắn vì có lễ độ che chở."
  },
  "0,2": {
    connection: "Trời (Càn) bao la, Lửa (Ly) là ánh mặt trời tỏa sáng rực rỡ ở giữa bầu trời.",
    deepMeaning: "Ánh sáng tỏa rạng không tư vị, sưởi ấm cho vạn vật. Quẻ khuyên con người nên đồng tâm hiệp lực, hòa đồng với đại chúng, bỏ đi những kỳ thị nhỏ nhen thì đại nghiệp chí công vô tư sẽ tất thành."
  },
  "0,3": {
    connection: "Trời (Càn) cao vời, Sấm (Chấn) vang động dưới vòm trời.",
    deepMeaning: "Sự vận động tuân theo lẽ trời thì không bao giờ sai lầm. 'Vô vọng' có nghĩa là không xảo trá, không làm bừa. Chỉ cần giữ tấm lòng chân thật, thuận theo tự nhiên thì gặt hái phước lành, ngược lại cưỡng cầu vọng động sẽ rước họa."
  },
  "0,4": {
    connection: "Trời (Càn) rộng lớn bao bọc vạn vật, Gió (Tốn) thổi lướt khắp mọi nơi dưới trời.",
    deepMeaning: "Quẻ của sự tương ngộ, cấu kết một cách ngẫu nhiên. Như gió chạm vào cảnh vật. Cảnh báo về những mối duyên đến nhanh chóng, đặc biệt nữ giới (âm) đang lấn lướt nam (dương), cần tỉnh táo trước những cám dỗ bất ngờ."
  },
  "0,5": {
    connection: "Trời (Càn) và Nước (Khảm) vốn dĩ vận hành ngược chiều nhau (trời đi lên, nước chảy xuống).",
    deepMeaning: "Khi chí hướng không đồng nhất ắt sinh ra tranh cãi, tụng đình. Người xem quẻ cần kiềm chế, nếu tiếp tục bảo thủ tiến tới tranh biện kiện tụng thì cuối cùng cả hai bên đều sẽ mang thương tích."
  },
  "0,6": {
    connection: "Trời (Càn) ở trên, Núi (Cấn) ở dưới vững chãi nhưng có cao thế nào cũng không chạm tới vòm trời.",
    deepMeaning: "Báo hiệu thời điểm tiểu nhân đắc thế, bóng tối đang bao trùm. Bậc thức giả nên biết thoái bộ, 'độn' (rút lui) về ở ẩn bảo toàn khí tiết và lực lượng, chờ đợi thời cơ sáng sủa hơn."
  },
  "0,7": {
    connection: "Trời (Càn) dương khí thăng lên, Đất (Khôn) âm khí giáng xuống, tách rời nhau.",
    deepMeaning: "Thời kỳ bế tắc tột độ, trời đất không còn giao hòa sinh sôi. Kẻ xấu, ngụy quân tử nắm quyền, người tài trí bị đẩy lùi. Khẩn thiết khuyên nhẫn nhục, giữ vững lập trường chứ không hùa theo cái xấu."
  },

  "1,0": {
    connection: "Đầm/Hồ (Đoài) nước dâng cuồn cuộn ngập cả lên tới Trời (Càn).",
    deepMeaning: "Thể hiện hành động dứt khoát, quyết tâm phá vỡ đê đập để cuốn trôi sỉ nhục, diệt trừ tiểu nhân. Khuyên phải sử dụng sức ảnh hưởng và thông báo công khai trước khi có hành động quyết liệt."
  },
  "1,1": {
    connection: "Hai hồ nước (Đoài) đứng cạnh nhau, bổ sung nguồn nước tưới mát cho nhau.",
    deepMeaning: "Tượng trưng cho sự hân hoan, niềm vui tương trợ lẫn nhau. Bằng lời nói êm đẹp và sự hòa duyệt, bạn sẽ thu phục được nhân tâm, biến chuyện lớn thành nhỏ, kết thân bạn bằng hữu chí xác."
  },
  "1,2": {
    connection: "Đầm nước (Đoài) ở trên dập tắt lửa, mà Lửa (Ly) ở dưới cũng đun cạn nước.",
    deepMeaning: "Là cuộc cách mạng thực sự mang tính đập đi xây lại (lột xác). Quẻ thúc giục từ bỏ những lề thói cũ mục nát, mạnh dạn phá bỏ vùng an toàn để vươn tới một quy chuẩn hoàn thiện hơn."
  },
  "1,3": {
    connection: "Đầm rỗng (Đoài) ở trên mở rộng bao dung, Sấm (Chấn) giấu mình êm ả dưới đáy.",
    deepMeaning: "Lấy sự thuận tòng làm gốc. Bậc đại trượng phu cũng có lúc phải mềm mỏng đi theo (Tùy) người khác, thuận theo tự nhiên và trào lưu thời đại để chuẩn bị kỹ càng, đạt được sự hanh thông."
  },
  "1,4": {
    connection: "Đầm/Hồ (Đoài) mênh mông ở trên nhấn chìm cây cối/gió (Tốn) ở dưới.",
    deepMeaning: "Sự việc đã phát triển quá mức giới hạn, tựa như cột nhà trĩu nặng sắp trĩu gãy vì gánh quá sức. Phải lập tức san sẻ bớt gánh nặng, tìm sự thư giãn, nếu cực đoan tiến lên sẽ gãy đổ."
  },
  "1,5": {
    connection: "Nước (Khảm) đã cạn khô rút hết khỏi mặt Hồ (Đoài).",
    deepMeaning: "Rơi vào cảnh khốn cùng, bế tắc mọi đường, cạn kiệt tài lực và tinh thần. Lúc này càng vùng vẫy càng kiệt sức, chỉ nên nhẫn nhịn ngậm đắng nuốt cay để vượt qua giai đoạn này khôn ngoan."
  },
  "1,6": {
    connection: "Hồ nước (Đoài - Thiếu Nữ) vui vẻ hội ngộ cùng Núi (Cấn - Thiếu Nam).",
    deepMeaning: "Sự cảm ứng tự nhiên vô tư lự, nam nữ thu hút lẫn nhau. Ám chỉ tình duyên vừa chớm nở rất tươi đẹp hoặc một sự thấu hiểu tương thông bất ngờ giữa những đối tác có thiện ý."
  },
  "1,7": {
    connection: "Đầm (Đoài) tụ lại thành hồ nước lớn trên mặt Đất (Khôn).",
    deepMeaning: "Sự hội tụ tinh hoa, quần anh tụ hội, gom góp tài nguyên. Quẻ điềm lành vạn thùy may mắn, khuyên nên sử dụng những vật phẩm quý giá, tiến hành những việc đại sự tế lễ hoặc liên minh lập hội."
  },

  "2,0": {
    connection: "Sự tỏa sáng rực rỡ của Lửa (Ly) chói lọi trên nền Trời (Càn).",
    deepMeaning: "Đại cát! Của cải và tiếng tăm dồi dào, quyền bính nắm trong tay như mặt trời giữa ngọ ban phát sự sống. Hãy sử dụng vinh quang hiện có để soi sáng, giúp đỡ người khác thì phước báu lưu truyền."
  },
  "2,1": {
    connection: "Lửa (Ly) có xu hướng bốc cháy bay lên cao, Nước Hồ (Đoài) thấm chảy xuống dưới sâu.",
    deepMeaning: "Biểu hiện của sự chia lìa, mỗi người một ngả, bất đồng quan điểm gay gắt. Trong những việc lớn thì đành dang dở, chỉ nên bằng lòng giải quyết những việc nhỏ nhặt cẩn trọng."
  },
  "2,2": {
    connection: "Lửa (Ly) không ngừng tiếp nối, cháy cháy sáng rực nương cậy vào củi.",
    deepMeaning: "Vạn vận không thể tự tồn tại mà phải có sự bám víu (Lửa bám vào rơm vật chất). Nhấn mạnh tầm quan trọng của việc chọn đúng nền tảng (minh quân/minh sư) để dựa dẫm và tỏa sáng chân thành."
  },
  "2,3": {
    connection: "Tia chớp từ Lửa (Ly) thắp sáng báo hiệu cùng tiếng sấm (Chấn) rền vang bủa vây.",
    deepMeaning: "Tượng của sự trừng phạt và pháp luật. Chướng ngại vật đang chèn ở giữa, cần phải quyết liệt 'cắn hợp' bẻ gãy nó. Làm việc đòi hỏi sự minh bạch rành mạch và sử dụng sức mạnh răn đe."
  },
  "2,4": {
    connection: "Gió (Tốn) xúi củi quạt ngọn Lửa (Ly) hừng hực nấu chín thức ăn trong vạc lớn.",
    deepMeaning: "Cái Vạc (Đỉnh) tượng trưng cho chân mệnh, chế độ mới, quyền hành được thiết lập. Sự nghiệp đang trên đà đúc kết thăng tiến lớn lao, hóa bùn thành vàng, hưởng giàu sang danh vọng."
  },
  "2,5": {
    connection: "Lửa (Ly) ở trên bốc lên không sưởi ấm được Nước (Khảm) ở dưới trôi tụt mất.",
    deepMeaning: "Dở dang tột độ, mọi thứ tưởng chừng êm xuôi nhưng vì không kết nối đúng khớp nên mất tác dụng. Báo hiệu ranh giới trước bình minh, đòi hỏi sự sắp xếp lại cực kỳ tỉ mỉ và thận trọng."
  },
  "2,6": {
    connection: "Lửa (Ly) cháy lan truyền trên sườn Núi (Cấn) theo hướng gió, không lưu lại một chỗ.",
    deepMeaning: "Điềm báo sự lang bạt, cuộc sống viễn xứ, khách lạ nơi xứ người không có gốc rễ chắc chắn. Quẻ dặn dò đi xa phải nhún nhường, thủ phận, tuyệt đối không được kiêu ngạo rước vạ vào thân."
  },
  "2,7": {
    connection: "Mặt trời rực rỡ (Ly) cuối cùng cũng trồi lên khỏi mặt Đất (Khôn).",
    deepMeaning: "Ánh sáng đã quay rạng. Công lao sau thời gian tăm tối vùi dập nay đã được công nhận hiển vinh. Cứ thẳng bước tiến lên (Tấn), hứa hẹn sự nghiệp sẽ thăng tiến chói chang rực rỡ."
  },

  "3,0": {
    connection: "Tiếng Sấm chấn động (Chấn) nổ vang vọng trùm lên cả bầu Trời (Càn).",
    deepMeaning: "Thế lực và sức mạnh đang đạt đỉnh cực kỳ bạo cường, muốn gì được nấy. Nhưng chính sự cường liệt này dễ dẫn đến hống hách thô bạo. Quân tử phải dùng đạo nghĩa để kìm hãm lại sự kiêu ngạo."
  },
  "3,1": {
    connection: "Sấm (Chấn) là động, nấp trên Đầm/Hồ vui vẻ (Đoài). Động vì niềm vui bộc phát.",
    deepMeaning: "Một tiến trình diễn ra lộn xộn mất trật tự, như thiếu nữ bồng bột chạy theo tình yêu mà qua mặt lễ giáo. Kết quả sớm muộn cũng dẫn tới sự đổ vỡ hoài mong do nền móng quan hệ bị sai trái."
  },
  "3,2": {
    connection: "Sấm nổ (Chấn) cộng hưởng sát bên tia chớp Lửa (Ly) chói lòa cả một vùng.",
    deepMeaning: "Thời kỳ cực thịnh, giàu có và tỏa sáng nhất trong các giai đoạn. Làm gì cũng hanh thông. Tuy nhiên cổ nhân nhắc 'Mặt trời tới giữa trưa thì sẽ xế, trăng rằm rồi sẽ khuyết', cẩn thận lúc thoái trào."
  },
  "3,3": {
    connection: "Sấm sét (Chấn) ầm ầm vang dội liên tiếp, kinh hồn bạt vía.",
    deepMeaning: "Chấn động lớn lao làm con người sợ hãi. Nhưng sự sợ hãi này là cần thiết để nhìn nhận và sửa đổi lại lỗi lầm trầm kha. Nhờ biết nơm nớp lo liệu mà sau đó vạn sự sẽ đạt tới sự bình an vô sự."
  },
  "3,4": {
    connection: "Tiếng sấm (Chấn) dội và Gió (Tốn) quật cường đan xen không rời.",
    deepMeaning: "Sự kiên định bền chặt dài lâu (Hằng). Con đường nào cũng có dông bão nhưng chỉ những người giữ lập trường kiên định, thấu hiểu đạo nghĩa (như vợ chồng) thì mới đồng hành đi tới cuối bến bờ."
  },
  "3,5": {
    connection: "Sấm nổ (Chấn) tan theo mưa (Nước/Khảm) dạt dào làm bừng tỉnh vạn vật.",
    deepMeaning: "Là quẻ của sự ân xá, tan băng. Mọi khó khăn nguy nan đã được gỡ bỏ tháo tung, khí trời tươi sáng trở lại. Cơ hội vàng để hành động thu hồi vốn và giải hòa mọi đố kỵ mâu thuẫn dai dẳng."
  },
  "3,6": {
    connection: "Tiếng sấm vang dài (Chấn) rồi cũng bị thung lũng của Núi (Cấn) chắn lại và đi xuống.",
    deepMeaning: "Báo động có tiểu nhân, chuyện phiền hà nhỏ xíu nhưng quấy nhiễu dai dẳng như chim kêu bay ngang bầu. Không nên thực hiện dự án khổng lồ, chỉ hợp mưu sinh an toàn ở quy mô nhỏ."
  },
  "3,7": {
    connection: "Tiếng sấm (Chấn) rền vang từ sâu trong lòng vạn vật Đất (Khôn).",
    deepMeaning: "Báo hiệu mùa xuân, mùa màng đang thai nghén và chuẩn bị sinh trỗi. Kêu gọi chớ vội vàng, nên dành thời gian tính toán lập dự án chuẩn bị, vui chơi ca hát (Dự) tích trữ sinh lực để đón ngày bung nở."
  },

  "4,0": {
    connection: "Gió (Tốn) thổi lướt ngang trời (Càn), gom mây nhưng yếu ớt chưa thành mưa rơi xuất trận.",
    deepMeaning: "Thời điểm này lực lượng còn yếu, sự tích lũy chưa đủ độ chín. Bắt buộc phải bao dung, nhẫn nại, nỗ lực gom nhặt từng chút thành quả nhỏ để vun đắp sức mạnh tới ngày mây mưa dội ào."
  },
  "4,1": {
    connection: "Gió (Tốn) nhu hòa lướt trên mặt Đầm/Hồ (Đoài) gợi lên những vành sóng lăn tăn đồng điệu.",
    deepMeaning: "Yếu quyết giải quyết mọi trở lực là ở chũ 'Tín' (Trung Phu). Chỉ có đem sự chân thành trọn vẹn, thật thà từ nội tâm (chứ không phải xảo ngữ) mới có thể đi qua cả những trở ngại hiểm nghèo nhất."
  },
  "4,2": {
    connection: "Gió (Tốn) thổi bùng khiến Lửa (Ly) càng cháy rực, xuất phát từ chỗ trong nếp nhà ra ngoài.",
    deepMeaning: "Nhắc nhở con người nền tảng tề gia trị quốc, hậu phương có yên ổn ấm áp (gia đình/đội nhóm nội bộ) thì ra ngoài mới đắc lợi. Đề cao đạo nghĩa nữ nhân, nề nếp yêu thương vun vén gia môn."
  },
  "4,3": {
    connection: "Gió mây (Tốn) quyện vào cùng Sấm sét (Chấn) bùng nổ năng lượng dời sông lấp bể.",
    deepMeaning: "Cơ hội rực rỡ để kiến tạo những giá trị to lớn ích nước lợi dân. Thấy mầm mống điều thiện thì phải sấn tới làm ngay, gặt hái phước lành, lợi nhuận lớn mạnh trong chớp mắt."
  },
  "4,4": {
    connection: "Những luồng gió (Tốn) liên tiếp hòa quyện cùng chiều, thổi theo nhau không đứt quãng.",
    deepMeaning: "Sự thâm nhập dần dần nhưng len lỏi thấu triệt tận mọi kẽ hở vạn vật. Quẻ khuyên cần phải dùng sự ôn hòa, phục tùng người chỉ huy giỏi, thì theo dòng chảy ắt sẽ đạt được thành công bền vững."
  },
  "4,5": {
    connection: "Gió vút mạnh (Tốn) làm mặt Nước (Khảm) nổi sóng dạt ra muôn phương tan lớp băng đọng.",
    deepMeaning: "Báo hiệu chia ly, tán loạn tài sản. Tuy nhiên lại là điềm tốt nếu trước đó đang chịu kìm kẹp, dính líu pháp lý; gió sẽ thổi tan sự giam cầm, giải phóng tình thế lọt qua hiểm cảnh nhờ tài uyển chuyển."
  },
  "4,6": {
    connection: "Cây cối non (Gió/Tốn) mọc chót vót bám trụ và leo dần lên vách Núi dốc đá (Cấn).",
    deepMeaning: "Sự phát triển tiệm tiến, từng bước nhỏ đo lại đều đều kiên nhẫn. Sự nghiệp và tình gởi gắm theo mô hình truyền thống bài bản, chậm mà chắc. Vội vàng xao động lập tức sẽ sẩy chân."
  },
  "4,7": {
    connection: "Gió nhẹ (Tốn) chu du khắp vọi ngóc ngách phủ đầy mặt Đất bao la (Khôn).",
    deepMeaning: "Tầm nhìn bao quát từ trên cao. Quẻ khuyên con người cần tạm dừng tay, giữ tâm tĩnh lặng để quan sát diễn biến (nhìn thấu vấn đề) và đồng thời phải trở thành gương mẫu ngời sáng cho kẻ dưới soi vào."
  },

  "5,0": {
    connection: "Hơi Nước (Khảm) tụ dày thành Mây mịt mù trên Trời (Càn), âm u nhưng chưa đổ xuống mưa rào.",
    deepMeaning: "Biểu hiện mạnh mẽ của sự Nhu (chờ đợi nấn ná, nghỉ ngơi bảo toàn sức lực). Việc tuy sắp thành nhưng chưa đủ nhân duyên. Ép buộc lúc này sẽ bể nát trắc trở. Uống rượu vui vẻ đợi thời thế đến."
  },
  "5,1": {
    connection: "Nước (Khảm) đổ dần dần tràn lấp vào đầy hồ/Đầm trũng (Đoài).",
    deepMeaning: "Hồ đầm dẫu to nhưng dung tích có hạn, nếu nước vào vô số mà không biết ngăn đập xả dòng (Tiết chế) ắt sẽ vỡ òa tan hoang lũ lụt. Khuyên răn bỏ sự tham lam chừng mực trong hưởng thụ lộc vị."
  },
  "5,2": {
    connection: "Nước mát (Khảm) ở trên đun sôi bằng ngọn Lửa cháy (Ly) ở dưới, sự phân bố hoàn hảo để làm thuốc hay nấu ăn.",
    deepMeaning: "Hanh thông, hoàn thành chu toàn trọn vẹn lý tưởng mọi bề. Tuy nhiên cũng cảnh báo, khi mọi việc trên đỉnh thành tựu, nếu lơ là ngủ quên trên chiến thắng, trật tự đảo lộn lập tức sẽ dẫn đến sự lung lay tiêu diệt."
  },
  "5,3": {
    connection: "Nước/Mưa (Khảm) dội trên sấm sét ầm vang (Chấn). Mầm xanh chui rúc đâm vọt dưới bùn lầy nguy nan.",
    deepMeaning: "Giai đoạn hỗn mang, khốn khó truân chuyên chặng đầu của việc tạo dựng cơ đồ. Bắt buộc phải có những đồng minh trung tín hỗ trợ thì mới vượt qua được cửa ải khó vỡ này."
  },
  "5,4": {
    connection: "Nước ngầm (Khảm) từ dưới đáy được Gió (Tốn/Gỗ) làm gàu kéo gánh vớt lên nuôi vạn vật.",
    deepMeaning: "Tượng cái giếng - nguồn sống bất dịch bất biến dẫu qua bao đời, làng mạc có bị rời đi thì cội nguồn vẫn ở đó. Khuyên nuôi dưỡng lòng nhân từ vô vị tài lợi."
  },
  "5,5": {
    connection: "Nước (Khảm) nối dòng cuồn cuộn đổ thác nguy hiểm dồn dập, sóng này chưa qua sóng khác đã tới.",
    deepMeaning: "Hiểm địa bủa vây, gian nan liên tiếp đả kích vào sinh mệnh vật chất. Nếu tâm chí bất định hoảng hốt sẽ chìm đáy. Chỉ có sự chân thành dũng cảm bơi nương theo dòng mới mòng tìm thấy đường sống mong manh."
  },
  "5,6": {
    connection: "Nước lũ tuôn cuộn (Khảm) kẹt cứng bị vách Núi (Cấn) chắn ngang đứt gãy không tìm ra dòng lộ.",
    deepMeaning: "Bế tắc, trước mắt là chướng ngại vật khổng lồ khó nuốt tươi. Ở trạng thái này vác sức kháng cự chỉ mang tật nguyền, cần dừng khựng hoàn toàn, chờ sự trợ trạm của đại hiệp phương xa thì mới mở bước đi tiếp được."
  },
  "5,7": {
    connection: "Nước trong trẻo (Khảm) ôm ấp rịn thâm quyện chặt vào mặt Đất (Khôn).",
    deepMeaning: "Tương thân tương ái, gắn bó mật thiết thuận hòa. Kẻ dưới tôn kính xúm xít người trên, người minh quân trên cao soi tỏa ban đức cho đại chúng. Thời cơ lấp lánh để kết giao hợp đồng hôn nhân."
  },

  "6,0": {
    connection: "Ngọn đồi Núi sừng sững (Cấn) bao phủ trùm lấp và đóng khung cả năng lượng vĩ đại của Trời (Càn).",
    deepMeaning: "Chứa đựng trí lực và tài năng ở mức độ kinh người, năng lượng dồn ứ tiềm ẩn chờ thời bùng nổ, có sức mạnh dời đổi giang sơn. Thời kỳ học hỏi để dưỡng đức vĩ nhân."
  },
  "6,1": {
    connection: "Đào sâu moi múc khoét phần đất của Đầm (Đoài) cắp lên vun trên mặt Núi (Cấn).",
    deepMeaning: "Tổn hao, dẹp bỏ bớt dục vọng và vật chất bề ngoài để bồi bổ cho phần trên cao (đức hạnh). Tự làm thiệt thòi một chút nơi mình nhưng vạn sự lợi ích dài lâu thu hồi tâm tính thiện lương."
  },
  "6,2": {
    connection: "Xung quanh vách Núi (Cấn) hắt lên vẻ rực rỡ của Lửa hoàng hôn (Ly).",
    deepMeaning: "Trang trí, làm dáng, tô bồi hình bóng bên ngoài thật trau chuốt bắt mắt nhưng thiếu cốt lõi thực chất. Có thể áp dụng cho văn hóa nghệ thuật nhưng trong đạo đối nhân xử thế đòi hỏi phải đề cao sự mộc mạc."
  },
  "6,3": {
    connection: "Dưới chân Núi tĩnh lặng bao bọc (Cấn) có Sấm rung rền chuyển động dồn dập nhịp nhàng (Chấn). Tượng quai hàm.",
    deepMeaning: "Nguồn cội của sức khỏe và trí lực là sự ẩm thực và lời ăn tiếng nói. Họa hay phúc đều từ cửa miệng xuất tuôn. Yêu cầu tiết chế nghiêm ngặt lời lẽ và tu tâm bổn thân tĩnh tại nhai nuốt tinh hoa."
  },
  "6,4": {
    connection: "Gió ẩm (Tốn) lùa len tụ quẩn bị chôn kẹt trong thung sâu chân Núi vực thẳm bế tắc (Cấn).",
    deepMeaning: "Tượng đồ cũ nát, mục rữa sinh nấm, sinh cặn hủ bại giòi mọt từ trong gốc rễ. Yêu cầu ngay lập tức phải có ý chí khai phá đại tu can thiệp sửa đổi để dọn dẹp đống bảo thủ dơ bẩn này đi dứt điểm không nương tay."
  },
  "6,5": {
    connection: "Núi (Cấn) hùng tráng đan xen chập chùng những lớp Mây mù Nước sương đặc (Khảm) mờ ảo vô ngã.",
    deepMeaning: "Thơ ấu, bế tắc ý tưởng, thiếu định hướng mơ màng mông muội không lối đi rành rẽ. Khuyên phải kiếm tìm minh sư dẫn lối chỉ đường, giữ thái độ khiêm nhường mạn kính phục rèn kỉ luật."
  },
  "6,6": {
    connection: "Hai ngọn Núi hùng vĩ (Cấn) trấn áp uy nghi đứng cạnh nhau trơ gan với đá sỏi.",
    deepMeaning: "Đứng im phăng phắc, dừng lại bế quan dập tắt mọi hành động truy kích vọng tưởng. Nội tại tâm thế tĩnh như núi sâu không nao dạ trước thị phi oán thù, đạt tới cái cảnh tự tại thiền định, lùi một bước vạn sự yên."
  },
  "6,7": {
    connection: "Sườn Núi (Cấn) bị phong hóa bào mòn lở trôi từng mảng đổ sập tan tành xuống Đất (Khôn).",
    deepMeaning: "Giai đoạn cùng tột của âm hiểm, tiểu nhân lên lấn lướt dìm đạp tiêu hao tiêu diệt chính khí. Cơ đồ sụp đổ thê thảm, cảnh báo chớ giao tranh vội lúc này, che chắn thu hồi bảo tồn sinh mạng đợi trời chuyển dương."
  },

  "7,0": {
    connection: "Khí âm của Đất mẹ (Khôn) đang ở trên đẩy giáng hòa quyện cùng dương khí của Trời dương (Càn) đang bốc vút lên.",
    deepMeaning: "Đường dây giao thông vũ trụ thông suốt tuyệt hảo, âm dương đối lưu xáo quyện sinh trưởng vô vàn muôn vật rực rỡ tươi lộng lẫy phồn vinh. Tín hiệu đỉnh cao vô thượng của Hạnh Phúc viên mãn, Thái bình an khang!"
  },
  "7,1": {
    connection: "Đất Mẹ (Khôn) ở đằng trên che chở xám hối bảo bọc Đầm Nước (Đoài) sâu ở dưới.",
    deepMeaning: "Hình tượng người bề trên rộng rãi hạ mình tới chiếu cố bảo hộ vỗ về kẻ lệ thuộc. Tượng trưng cho sự giám sát ân cần, vận mạng đi vào thời khắc quang vinh xán lạn đang trỗi mạnh phát hào rực."
  },
  "7,2": {
    connection: "Màn đêm Đất Mẹ (Khôn) trút sập phủ dập đè nghẹt thở chết tươi ngọn lửa sáng lòa huy hoàng (Ly).",
    deepMeaning: "Đau thương! Ánh sáng và trí lực thâm tài phải giấu nhẹm đi để giả ngu giả dại trốn tránh ánh mắt dòm ngó của bạo chúa thị phi rập rình ám hại. Tuyệt độ không được để lộ vẻ xán lạn khoe khôn chuốc thảm mưu kế đẫm lệ."
  },
  "7,3": {
    connection: "Một tia Sấm chớp mầm sống lòi nứt (Chấn) động rung sâu thẳm dưới lòng Đất khổng lồ lạnh giá (Khôn).",
    deepMeaning: "Bóng tối cùng kiệt sắp bay sập. Lẽ phản phục, quy luật tuần hoàn đang bắt đầu ló rạng khôi sinh tái tạo sau cơn đông chôn giấu dài dặc. Mang dấu triện kỳ vọng thành công tương lai huy hoàng vừa chớm nảy cọng nõn xanh."
  },
  "7,4": {
    connection: "Mầm Cây non dũng mãnh đâm rách rễ (Tốn) khoan thủng Đất dày (Khôn) chọc nát lăng mọc thẳng vun vút lên vũ trụ.",
    deepMeaning: "Sự thăng tiến dồi dào, thuận bề suôn sẻ tiến công mãnh liệt. Quý nhân phù trợ xum vầy nâng bước. Giai đoạn thuận lợi mây mù tan vẹt để đón vận hội thi hành đại cường ý nguyện ngoạn du tới sao mai chói."
  },
  "7,5": {
    connection: "Mạch Nước ngầm sâu trong hang thẳm giấu bao la tụ nguồn (Khảm) ẩn nhịn dưới lòng Đất mẹ dung chứa (Khôn).",
    deepMeaning: "Sức mạnh kinh người của binh tướng đại chúng (Đám đông) được ghim nén. Khi dụng tới đạo cầm quan Sư (Quân đội lính tráng thị uy quyền pháp) ắt bắt buộc điều kiện kỉ luật thép uy nghiêm diệt bạo bình loạn tàn khốc mới an khang."
  },
  "7,6": {
    connection: "Quả Núi vô cùng to lớn ngạo nghễ (Cấn) cũng bị vùi dập chìm ép giấu tận sâu dưới lòng bình nguyên khoáng đạt Đất Mẹ (Khôn).",
    deepMeaning: "Chân lý chói ngời của bậc hiền triết: Đức Khiêm Nhường. Càng hạ mình che đậy sự vĩ đại kiêu kì khoe khang thì càng được vạn vật rạp phục dâng kính phục ngàn nể tột độ. Phước điềm của vũ trụ đổ dội ban ân vô lượng trác tuyệt."
  },
  "7,7": {
    connection: "Lớp Đất này nằm tĩnh mịch vĩnh viễn đắp nương chồng chéo lên tầng Đất khác (Khôn) làm giá đỡ êm thụ bệ nuôi đại.",
    deepMeaning: "Thạch trụ bảo cái, cực độ nhu thuận hiền hòa dung dị hy sinh cho vạn muôn chúng sinh bất biết hờn oán. Yêu cầu kẻ xem biết bao dung, phục tòng bền bỉ lầm lì kiên trung theo dấu chân người minh triết khôn khéo điệp điệp bước sau dẫn đỉnh!"
  }
};
