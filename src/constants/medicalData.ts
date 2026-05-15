export interface MedicalInfo {
  title: string;
  descriptions: Record<string, string>;
}

export const MEDICAL_DATA: Record<string, MedicalInfo> = {
  'Tỵ': {
    title: 'I. TIM',
    descriptions: {
      'NQ': 'Mạch ngoài là Càn cực dương khắc Chấn Mộc gây Ngũ Quỷ cho Chấn, Ngũ Quỷ thuộc Hỏa sinh ra ở Chấn tâm gây Tâm hỏa vượng gây các chứng đàm Hỏa nhập Tâm, Mộc lại sinh Hỏa khắc Càn Kim, gây bị đốt hết dương khí trong Tim gây đàm mê Tâm khiếu, thoát Dương đột quỵ hoặc tử vong (Rối loạn chức năng của Tim). Triệu chứng ban đầu Tâm phiên nhiệt, mặt đỏ, mắt đỏ, ngực tức, chóng mặt, sau đó người vả mồ hôi, toàn thân lạnh (thoát Dương). Rồi dẫn đến đột quỵ.',
      'LS': 'Quẻ Cấn là vỏ Tim bị Chấn khắc Lục Sát, Lục Sát thuộc Thủy sinh Mộc khắc Thổ, thường là bệnh về thiểu năng Động mạch vành gây hay bị tức ngực, đau nhói vùng Tim cũng hay xảy ra với người hẹp hở van Tim.',
      'HH': 'Khôn chủ Âm, chủ thấp, gây bệnh thấp Tim, người mệt mỏi, hay có hiện tượng trầm cảm. Đôi lúc loạn ngôn, hay tự lẩm bẩm nói chuyện một mình.',
      'TM': 'Đoài theo y học cổ truyền là đờn trọc khắc Chấn (tâm) gây tuyệt mạng cho Tâm, tuyệt mạng là Đoài, hai Đoài khắc một Chấn, vậy bệnh lý là, đàm nhập Tâm, mỡ bao Tim, mỡ trong máu, dễ gây các hiện tượng hẹp động tĩnh mạch, to tim, bệnh đàm mê tâm khiếu, dễ gây bệnh hôn mê, đột quỵ hoặc tử vong.'
    }
  },
  'Ngọ': {
    title: 'II. TIỂU TRƯỜNG',
    descriptions: {
      'NQ': 'Bộ khung của Tiểu Trường là Chấn: Lúc đầu Chấn Mộc khắc Khôn Hỏa gây Khôn bị ngũ quỷ, ngũ quỷ thuộc Hỏa Âm bị suy sinh nội nhiệt. Bệnh rối loạn tiêu hóa ở Ruột non viêm nhiễm thể ác tính ở ruột non nhiệt kết ở ruột non. Gây đau quanh vùng bụng, tiểu đỏ tiện táo bón, tâm phiền nhiệt, đau đầu dị ứng mẩn ngứa.',
      'LS': 'Làm mất khả năng điều tiết của ruột non gây bệnh tiêu chảy đau dạng co thắt.',
      'HH': 'Họa Hại thuộc quẻ Khôn, 2 Mộc khắc Khôn (Thổ). Khôn là cực Âm bị 2 Mộc khắc, gây Âm bị mất, gây bệnh nhu động ruột gia tăng, gây đau co thắt ở Ruột non, đau bụng, quặn từng cơn, âm hư sinh nội nhiệt gây tiêu dạng mót dặn, khó tiêu.',
      'TM': 'Đàm tích trong Ruột non, gây bệnh làm mất khả năng hấp thu các chất dinh dưỡng để đưa vào máu, gây bệnh tiêu phân có đàm, nhớt, kiết lỵ ...'
    }
  },
  'Sửu': {
    title: 'III. TỲ (LÁ LÁCH TUYẾN TỤY)',
    descriptions: {
      'NQ': 'Tỳ chủ thấp, sinh huyết, chống nhiếp huyết quẻ Khảm thuộc thấp, thuộc huyết bị Thổ khắc Thủy, tạo ngũ quỷ hỏa sinh Tỳ Thổ khắc Thủy. Tỳ bị rối loạn nội tiết tuyến tụy tạng, ung thư Tỳ hoặc viêm tụy cấp, làm cho Tỳ mất khả năng sinh huyết dễ gây nhiễm trùng huyết, ung thư máu dễ sinh bệnh lở loét toàn thân.',
      'LS': 'Tỳ bị Mộc Dương Chấn khắc sinh Lục Sát cho Tỳ Lục Sát thuộc Thủy sinh Mộc khắc Thổ, Chấn thuộc Mộc đới Hỏa sinh và khắc Thổ, gây Tỳ bị thấp nhiệt, người nặng nề, khả năng sin huyết sinh tâm kém, dễ bị bệnh Ban Đỏ, bệnh gút ..',
      'HH': 'Tỳ thấp nhiệt, người mệt mỏi hay đau toàn thân, miệng mồm hay bị lở loét, mắc các bệnh ghẻ lở mụn nhọt, sốt phát ban .. \n1. Triệu chứng tiêu hóa: Đầy bụng, chướng hơi. Ăn không ngon, khó tiêu. Buồn nôn hoặc nôn. Đại tiện bất thường (tiêu chảy hoặc táo bón, phân nát, có mùi hôi).\n2. Triệu chứng toàn thân: Cơ thể nặng nề, mệt mỏi. Miệng đắng, khô, khát nước. Da vàng, nổi mụn nhọt. Nước tiểu vàng, ít.\n3. Triệu chứng khác: Lưỡi đỏ, rêu lưỡi vàng, dày, nhờn. Mạch nhu, hoạt (mạch yếu và trơn).',
      'TM': 'Tỳ suy kiệt, thiếu máu, sự vận hóa của Tỳ Kim, tiểu đường.'
    }
  },
  'Thìn': {
    title: 'V. VỊ (DẠ DÀY)',
    descriptions: {
      'NQ': 'Ung thư dạ dày, viêm loét dạ dày thể ác tính, Hỏa sinh Thổ gây ngũ quỷ cho Thổ, Ngũ Quỷ thuộc Hỏa, gây dạ dày bị nung nóng như đất bị nung thành gạch.',
      'LS': 'Mộc Chấn khắc Thổ, Mộc vị chua, mang tính acid khắc Thổ, trong Đông Y gọi là thừa toan trong dạ dày (Toan là vị chua tính Acid), gây dạ dày bị đau rát, lúc đói đau tăng lên.',
      'HH': 'Họa Hại thuộc quẻ Khôn, Thổ sinh Kim Đoài, trong Đông y Dịch Đoài là đờm trọc, nên Dạ dày bị đờm tích, sinh bệnh đầy bụng, ăn khó tiêu, đờm thuộc nhóm Bazo trung hòa Acid trong Dạ dày nên gây chán ăn.',
      'TM': 'Lúc đầu Mộc Tốn khắc Thổ Cấn gây Tuyệt Mạng cho Thổ Cấn, hiện tượng này làm tê liệt chức năng của Dạ Dày , hoặc do can khí phạm vi Tuyệt mạng thuộc Đoài, đờm tính trong Dạ Dày nhiều gây mất chức năng co bóp của Dạ Dày.'
    }
  },
  'Hợi': {
    title: 'VI. THẬN TRÁI (THẬN THỦY)',
    descriptions: {
      'NQ': 'Thổ Cấn khắc Thủy Khảm gây Ngũ Quỷ (Hỏa) cho Khảm:\n- Rối loạn nội tiết tuyến thượng Thận\n- Sỏi Thận thể ác tính\n- Viêm cầu Thận\n- Khô Thận, teo Thận, kiệt tình gây đau nhức, tiểu dắt đỏ, tiểu khó.',
      'LS': 'Lục Sát thuộc Thủy, Kim Càn sinh Thủy trong Đông y gọi là Thận Dương Hư, Dương Hư sinh ngoại Hàn, người sợ lạnh chân tay lạnh, đau buốt xương khớp di tinh, liệt dương, tiểu nhiều, phân hay bị lỏng, lãng tai, mắt kém, trí nhớ suy giảm.',
      'HH': 'Họa Hại thuộc Khôn Thổ sinh Kim Đoài sinh Thủy. Đông y gọi là Thận Âm hư, Âm hư sinh nội nhiệt, dễ bị bệnh cốt chưng trong xương, bệnh thấp khớp người nóng tiểu đỏ, hay bị ù tai hoa mắt, tiểu dắt, tiện táo.',
      'TM': 'Sỏi Thận, liệt Thận, mở bao Thận, Khô Thận.'
    }
  },
  'Tý': {
    title: 'VII. BÀNG QUANG (SINH DỤC TRÁI)',
    descriptions: {
      'NQ': 'Rối loạn chức năng Bàng Quang, rối loạn nội tiết tuyến sinh dục, người chủ bàng quang hoặc sinh dục trái, u buồng trứng.',
      'LS': 'Càn thuộc dương sinh Thủy, lục sát cũng thuộc Thủy, dương Càn bị hư sinh Thủy vượng dương hư Thủy phiếm. Lạnh Bàng Quang và bộ phận sinh dục, sinh tiểu nhiều, tiểu tiện không tự chủ, lạnh cổ tử cung, loãng tinh trùng, nang buồng trứng.',
      'HH': 'Gây các bệnh viêm nhiễm ở Bàng Quang hay ở bộ phận sinh dục.',
      'TM': 'Tuyệt Mạng thuộc quẻ Đoài, Thổ sinh Kim, Kim sinh Thủy, Bàng Quang âm hư nội nhiệt nóng Bàng Quang và bộ phận sinh dục, dễ nhiễm đường tiết niệu, tắc buồng trứng .. nang tử cung buồng trứng, phì đại tuyến tiền liệt.'
    }
  },
  'Dậu': {
    title: 'VIII. PHỔI',
    descriptions: {
      'NQ': 'Ngũ Quỷ thuộc Hỏa, Hỏa khắc Kim (Phế). Bệnh rối loạn chức năng hô hấp, ung thư phổi, viêm phổi cấp, khô phổi, nhiệt kết trong phổi.',
      'LS': 'Lục sát thuộc Thủy, phổi Kim sinh Thủy sinh Mộc Tốn, Kim Đoài bị hư hao. Bệnh lao Phổi, tràn dịch màn phổi bệnh Thủy phế khí, dẫn phế nang, thở hụt hơi mất sức, khả năng hô hấp kém. Chức năng Phổi bị suy kiệt. Nếu người mập là tràn dịch màn phổi, nếu ốm là bị lao.',
      'HH': 'Phổi bị hàn tích, bị thấp hàn, các bệnh nước trong Phổi, tràn dịch màng Phổi, bệnh hen suyễn.',
      'TM': 'Liệt Phổi, ung thư Phổi, Đờm Tích trong Phổi gây suy hô hấp, Bệnh đàm tích trong Phổi.'
    }
  },
  'Thân': {
    title: 'IX. ĐẠI TRƯỜNG',
    descriptions: {
      'NQ': 'Rối loạn chức năng của Đại Tràng, ung thư Đại Tràng. Bệnh lỵ trực tràng, viêm nhiễm ở Đại Tràng.',
      'LS': 'Tăng nhu động gây đau Đại Tràng co thắt, Đại Tràng thể phong hàn, gây tiêu chảy, đau quặn từng cơn.',
      'HH': 'U Đại Tràng, Đại Tràng bị hàn thấp, gây đau bụng, đại tiện ra nhiều chất nhày, lạnh bụng.',
      'TM': 'Liệt ruột, nhu động ruột bị suy giảm tiêu khó, bệnh mót dặn, tiện không tự chủ.'
    }
  },
  'Mão': {
    title: 'X. GAN',
    descriptions: {
      'NQ': 'Ngũ quỷ thuộc Hỏa, mộc Tốn sinh Hỏa, hỏa sinh Khôn Thổ. Gây bệnh Gan bị thấp nhiệt, viêm gan các loại siêu vi, ung thư gan, gây rối loạn chức năng Gan, người nóng nhiệt, mắt đỏ, hay bị hoa mắt chóng mặt, dị ứng mẩn ngứa.',
      'LS': 'Đoài sinh Khảm, Khảm sinh Tốn, dễ gây các bệnh Gan nhiễm mỡ, ứ nước trong Gan gây sơ Gan cổ chướng.',
      'HH': 'Gan bị thấp nhiệt, Gan hỏa vượng gây chướng người nóng nhiệt, nhức đầu, hoa mắt, chóng mặt, táo bón, dị ứng mẩn ngứa, huyết áp cao.',
      'TM': 'U Gan, sỏi trong Gan, chai Gan, cứng Gan, sơ Gan.'
    }
  },
  'Dần': {
    title: 'XI. MẬT',
    descriptions: {
      'NQ': 'Lúc đầu Càn Kim khắc Mộc Tốn, Càn thuần Dương, gây bệnh nóng Mật, Rối loạn chức năng túi Mật hệ dịch Mật trong Gan, gây khô túi Mật, ....',
      'LS': 'Mỡ Bao túi Mật, có sỏi bên trong Mật, tràn dịch túi Mật.',
      'HH': 'Dịch Mật tiết ra nhiều, gây trào ngược thực quản, đau dạ dày, nhu động dịch Mật gia tăng gây tổn thương tỳ vị ảnh hưởng chức năng của huyết.',
      'TM': 'Sỏi túi mật, đàm tích trong túi Mật.'
    }
  },
  'Mùi': {
    title: 'XII. THẬN HỎA, TÂM BÀO, MỆNH MÔN',
    descriptions: {
      'NQ': 'Rối loạn nội tiết thượng Thận, viêm Thận, ung thư Thận, Mệnh Môn Hỏa không quy nguyên, rối loạn thần kinh tim',
      'LS': 'Sỏi cát nhỏ chưa thành viên, khả năng hoàn huyết của Tim kém, máu ko về dc tim, tiểu dắt, tiểu són.',
      'HH': 'Sỏi Thận Phải, u Thận, có u cục trong Tâm Bào, dễ gây tắc Động Mạch Vành của Tim',
      'TM': 'Thận Hỏa, Mệnh Môn hỏa khắc Càn gây đốt hết dương khí, gây thoát dương đột quy. Triệu chứng ban đầu người nóng rực lên, mồ hôi vả ra, sau đó lạnh toàn thân gây ngất, đột quỵ, rất dễ dẫn đến tử vong.'
    }
  },
  'Tuất': {
    title: 'XIII. TAM TIÊU + SINH DỤC PHẢI',
    descriptions: {
      'NQ': 'Rối loạn chức năng toàn thân, toàn thân bị viêm nhiễm, nổi u cục, u ác tính, hoặc u sơ tử cung buồng trứng, tuyến tiền liệt.',
      'LS': 'U buồng trứng, tuyến tiền liệt, gây tiểu khó, tiểu dắt, dễ gây bệnh thấp nhiệt toàn thân, gây các bệnh ngoài da ghẻ lở, viêm nhiễm.',
      'HH': 'Lúc đầu bị lạnh cổ tử cung, buồng trứng, làm yếu sinh lý ở Nam giới, sau đó gây hiện tượng mệt nhiểm, gây viêm nhiễm, toàn thân bị các bệnh viêm nhiễm thể hàn tích.',
      'TM': 'Hỏa đốt dương khí, gây thoát dương, lúc đầu người nóng dực, vả mồ hôi xong lạnh toát, gây tử vong.'
    }
  },
  'Năm - Thủy': {
    title: 'XIV. HUYẾT',
    descriptions: {
      'NQ': 'Ung thư Máu, rối loạn huyết sắc tố trong Máu, thoát dương trong Máu, nhiễm trùng Máu.',
      'LS': 'Huyết hàn, gây cho máu bị lạnh kém lưu thông, gây tê bì, nhức mỏi toàn thân, dễ gây bệnh trầm cảm, muộn hành kinh.',
      'HH': 'Huyết bị thấp nhiệt, máu khó lưu thông, hay bị nhiễm trùng máu, tiểu đường.',
      'TM': 'Nhiệt kết gây thoát dương trong Máu, gây đàm tích hóa Hỏa trong Máu, mỡ Máu.'
    }
  },
  'Tháng - Kim': {
    title: 'XV. TINH',
    descriptions: {
      'NQ': 'Trong cơ thể bị bóc Hỏa nóng đốt hết dương khí, gây rối loạn chuyển hóa tinh chất gây các chứng bệnh ung thư tủy, da ... toàn thân dễ phát sinh nhiều các u cục, ác tính.',
      'LS': 'Toàn bộ sự chuyển hóa trong người ở trạng thái dương hư, người lạnh, chân tay lạnh, trong cơ thể giữ nước, sinh các bệnh phù, bệnh béo phì.',
      'HH': 'Bệnh chân nhiệt giả hàn bên trong cơ thể nóng, nhưng bên ngoài sợ lạnh.',
      'TM': 'Cơ thể bị thoát dương sinh đàm tích hóa hỏa, ban đầu người nóng choáng váng ra nhiều mồ hôi, sau đó người bị lạnh dễ gây hôn mê và đột tử.'
    }
  },
  'Giờ - Mộc': {
    title: 'XVI. KHÍ',
    descriptions: {
      'NQ': 'Rối loạn vận khí cơ thể, gây ảnh hưởng đến sự vận động của hệ cơ trơn và cơ van gây rối loạn chức năng hoạt động của cơ thể. Ngoài ra Tốn Mộc sinh ngũ quỷ hỏa, ngũ quỷ Hỏa sinh Thổ, Thổ Khôn được sinh nên vượng, tạo ra bệnh ngoài nóng trong lạnh (chân hàn giả nhiệt)',
      'LS': 'Khí bị thấp nhiệt, Hỏa sinh Thổ khắc Thủy làm mất nước, mất điện giải, trong cơ có khí nóng ẩm hay gây các bệnh viêm nhiễm, dễ bị các loại vi khuẩn bệnh xâm nhập, dễ mắc các bệnh viêm nhiễm',
      'HH': 'Bệnh chân hàn giả nhiệt, lúc đầu Chấn (là Mộc đới Hỏa) Khắc Khôn Thổ, gây thịt nhưng Họa Hại thuộc Khôn, 2 Khôn Thổ phản khắc lại Mộc Chấn, mà Khôn thuộc âm thuộc hàn.',
      'TM': 'Khí âm hư sinh nội nhiệt, gây mất nước, người luôn bị nóng trong.'
    }
  },
  'Ngày - Hỏa': {
    title: 'XVII. THẦN',
    descriptions: {
      'NQ': 'Rối loạn thần kinh thực vật, ung thư não, tủy.',
      'LS': 'Thần Kinh bị thấp nhiệt, gây viêm dây thần kinh, Zô na Thần Kinh, hay đau đầu hoa mắt, chóng mặt, mất ngủ.',
      'HH': 'Thần Kinh thất thường lúc nóng lúc lạnh, lúc đầu Khôn sinh Càn âm hư nội nhiệt, gây nóng, bức rức, sau Họa Hại thuộc Khôn, 2 âm hư vượng sinh nội nhiệt, làm cơ chế thần kinh luôn thay đổi, lúc vui lúc buồn, lúc nóng lúc lạnh, không ổn định.',
      'TM': 'Lúc đầu Khôn khắc Khảm, do âm khí hàn vượng Thủy, làm cho huyết không nuôi dưỡng được Thần, gây thiếu máu não, nhũn não tắc hệ tuần hoàn của Thần, sinh chứng trầm cảm, tuyệt mạng quẻ Đoài (Đoài thuộc đàm ẩm, mỡ, trọc tà) xuất hiện trong máu (máu nhiễm mỡ nên khó vận hành đưa lên não) gây tổn thương hệ thần kinh. Sau đó Khôn sinh Đoài, Đoài sinh Khảm gây hiện tượng âm hư, thủy phiếm, dễ gây viêm đa thần kinh.'
    }
  }
};
